-- 0016_functions_indexes_policies
-- Security helpers, required RPCs, RLS, storage buckets + policies

-- ========== SECURITY HELPERS ==========
create or replace function private.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.blocked_relationships
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function private.is_accepted_connection(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.relationships
    where status = 'accepted'
      and ((requester_id = a and recipient_id = b) or (requester_id = b and recipient_id = a))
  );
$$;

create or replace function private.is_partner(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.relationships
    where status = 'accepted'
      and relationship_type = 'partner'
      and ((requester_id = a and recipient_id = b) or (requester_id = b and recipient_id = a))
  )
  or exists (
    select 1 from public.couples
    where status = 'active'
      and ((user_a_id = a and user_b_id = b) or (user_a_id = b and user_b_id = a))
  );
$$;

create or replace function private.is_circle_member(p_circle uuid, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle and user_id = p_user and status = 'active'
  );
$$;

create or replace function private.is_circle_leader(p_circle uuid, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.circle_members
    where circle_id = p_circle
      and user_id = p_user
      and status = 'active'
      and role in ('owner','leader')
  );
$$;

create or replace function private.is_conversation_member(p_conversation uuid, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation
      and user_id = p_user
      and left_at is null
  );
$$;

create or replace function private.has_staff_role(p_user uuid, p_role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user
      and role = p_role
      and (expires_at is null or expires_at > now())
  );
$$;

create or replace function private.has_entitlement(p_user uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.user_entitlements
    where user_id = p_user
      and entitlement_key = p_key
      and active = true
      and (ends_at is null or ends_at > now())
  );
$$;

create or replace function private.is_couple_member(p_couple uuid, p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1 from public.couples
    where id = p_couple
      and status in ('pending','active')
      and (user_a_id = p_user or user_b_id = p_user)
  );
$$;

revoke all on function private.is_blocked(uuid,uuid) from public;
revoke all on function private.is_accepted_connection(uuid,uuid) from public;
revoke all on function private.is_partner(uuid,uuid) from public;
revoke all on function private.is_circle_member(uuid,uuid) from public;
revoke all on function private.is_circle_leader(uuid,uuid) from public;
revoke all on function private.is_conversation_member(uuid,uuid) from public;
revoke all on function private.has_staff_role(uuid,public.staff_role) from public;
revoke all on function private.has_entitlement(uuid,text) from public;
revoke all on function private.is_couple_member(uuid,uuid) from public;

grant execute on function private.is_blocked(uuid,uuid) to authenticated;
grant execute on function private.is_accepted_connection(uuid,uuid) to authenticated;
grant execute on function private.is_partner(uuid,uuid) to authenticated;
grant execute on function private.is_circle_member(uuid,uuid) to authenticated;
grant execute on function private.is_circle_leader(uuid,uuid) to authenticated;
grant execute on function private.is_conversation_member(uuid,uuid) to authenticated;
grant execute on function private.has_staff_role(uuid,public.staff_role) to authenticated;
grant execute on function private.has_entitlement(uuid,text) to authenticated;
grant execute on function private.is_couple_member(uuid,uuid) to authenticated;

-- ========== REQUIRED BUSINESS FUNCTIONS ==========

create or replace function public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_points int,
  p_idempotency_key text,
  p_source_type text default null,
  p_source_id uuid default null,
  p_lesson_id uuid default null,
  p_reason text default null
)
returns public.user_xp_events
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_row public.user_xp_events;
  v_today date := (now() at time zone 'utc')::date;
begin
  if auth.uid() is distinct from p_user_id
     and not private.has_staff_role(auth.uid(), 'admin')
     and current_setting('role', true) <> 'service_role' then
    raise exception 'not authorized to award xp';
  end if;

  if p_points is null or p_points = 0 then
    raise exception 'points must be non-zero';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 then
    raise exception 'idempotency_key required';
  end if;

  insert into public.user_xp_events (
    user_id, lesson_id, source_type, source_id, event_type, points, xp_amount, reason, description, idempotency_key
  ) values (
    p_user_id, p_lesson_id, p_source_type, p_source_id, p_event_type, p_points, p_points, p_reason, p_reason, p_idempotency_key
  )
  on conflict (user_id, idempotency_key) where idempotency_key is not null
  do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.user_xp_events
    where user_id = p_user_id and idempotency_key = p_idempotency_key;
    return v_row;
  end if;

  insert into public.user_streaks (user_id, current_streak, longest_streak, last_completed_on)
  values (p_user_id, 1, 1, v_today)
  on conflict (user_id) do update set
    current_streak = case
      when public.user_streaks.last_completed_on = v_today then public.user_streaks.current_streak
      when public.user_streaks.last_completed_on = v_today - 1 then public.user_streaks.current_streak + 1
      else 1
    end,
    longest_streak = greatest(
      public.user_streaks.longest_streak,
      case
        when public.user_streaks.last_completed_on = v_today then public.user_streaks.current_streak
        when public.user_streaks.last_completed_on = v_today - 1 then public.user_streaks.current_streak + 1
        else 1
      end
    ),
    last_completed_on = v_today,
    updated_at = now();

  return v_row;
end;
$$;

-- Partial unique index cannot be targeted by ON CONFLICT unless matching; recreate as unique constraint via expression index name
-- Ensure conflict target works: use unique index on (user_id, idempotency_key) without predicate for non-null keys via coalesce sentinel
drop index if exists user_xp_events_idempotency_uidx;
create unique index user_xp_events_idempotency_uidx
  on public.user_xp_events (user_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.complete_lesson(p_lesson_id uuid)
returns public.user_lesson_progress
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_progress public.user_lesson_progress;
  v_card_count int;
  v_lesson public.academy_lessons;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select * into v_lesson from public.academy_lessons where id = p_lesson_id and status = 'published';
  if v_lesson.id is null then
    raise exception 'lesson not found or not published';
  end if;

  select count(*) into v_card_count from public.lesson_cards where lesson_id = p_lesson_id;

  select * into v_progress
  from public.user_lesson_progress
  where user_id = v_uid and lesson_id = p_lesson_id
  for update;

  if v_progress.id is null then
    raise exception 'lesson progress not found; start the lesson first';
  end if;

  if not (
    v_progress.prayer_completed
    and v_progress.opening_verse_viewed
    and v_progress.cards_completed_count >= v_card_count
    and v_progress.quiz_completed
    and v_progress.closing_verse_viewed
    and v_progress.closing_prayer_completed
  ) then
    raise exception 'lesson sequence incomplete';
  end if;

  update public.user_lesson_progress
  set status = 'completed',
      completed_at = coalesce(completed_at, now()),
      xp_earned = greatest(xp_earned, v_lesson.xp_reward),
      updated_at = now()
  where id = v_progress.id
  returning * into v_progress;

  perform public.award_xp(
    v_uid,
    'lesson_complete',
    v_lesson.xp_reward,
    'lesson_complete:' || p_lesson_id::text,
    'academy_lesson',
    p_lesson_id,
    p_lesson_id,
    'Completed lesson day ' || v_lesson.day_number::text
  );

  return v_progress;
end;
$$;

create or replace function public.seal_note(p_note_id uuid, p_sealed_until timestamptz default null, p_milestone text default null)
returns public.notes
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_note public.notes;
  v_version int;
begin
  select * into v_note from public.notes where id = p_note_id for update;
  if v_note.id is null then
    raise exception 'note not found';
  end if;
  if v_note.owner_id is distinct from v_uid then
    raise exception 'not note owner';
  end if;
  if v_note.seal_state = 'sealed' then
    raise exception 'note already sealed';
  end if;

  v_version := v_note.current_version + 1;

  insert into public.note_revisions (note_id, version_number, body, revision_type, created_by)
  values (p_note_id, v_version, v_note.body, 'seal_snapshot', v_uid);

  insert into public.consent_events (user_id, consent_type, version, resource_type, resource_id, decision, source)
  values (v_uid, 'note_seal', '1', 'note', p_note_id, true, 'seal_note');

  update public.notes
  set seal_state = 'sealed',
      sealed_until = p_sealed_until,
      sealed_milestone = p_milestone,
      current_version = v_version,
      status = 'sealed',
      updated_at = now()
  where id = p_note_id
  returning * into v_note;

  return v_note;
end;
$$;

create or replace function public.execute_virtual_order(
  p_portfolio_id uuid,
  p_security_id uuid,
  p_side text,
  p_quantity numeric
)
returns public.virtual_orders
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_portfolio public.market_portfolios;
  v_quote public.market_quotes_cache;
  v_order public.virtual_orders;
  v_position public.virtual_positions;
  v_cost numeric(18,2);
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'quantity must be positive'; end if;
  if p_side not in ('buy','sell') then raise exception 'invalid side'; end if;

  select * into v_portfolio from public.market_portfolios
  where id = p_portfolio_id and user_id = v_uid and status = 'active'
  for update;
  if v_portfolio.id is null then raise exception 'portfolio not found'; end if;

  select * into v_quote from public.market_quotes_cache
  where security_id = p_security_id and expires_at > now();
  if v_quote.security_id is null then raise exception 'no trusted cached price'; end if;

  v_cost := round(p_quantity * v_quote.last_price, 2);

  insert into public.virtual_orders (
    user_id, portfolio_id, security_id, side, quantity, execution_price, status
  ) values (
    v_uid, p_portfolio_id, p_security_id, p_side, p_quantity, v_quote.last_price, 'pending'
  ) returning * into v_order;

  if p_side = 'buy' then
    if v_portfolio.current_cash < v_cost then
      update public.virtual_orders set status = 'rejected', reject_reason = 'insufficient cash' where id = v_order.id
      returning * into v_order;
      return v_order;
    end if;

    update public.market_portfolios
    set current_cash = current_cash - v_cost, updated_at = now()
    where id = p_portfolio_id;

    select * into v_position from public.virtual_positions
    where portfolio_id = p_portfolio_id and security_id = p_security_id for update;

    if v_position.id is null then
      insert into public.virtual_positions (portfolio_id, security_id, quantity, average_cost)
      values (p_portfolio_id, p_security_id, p_quantity, v_quote.last_price);
    else
      update public.virtual_positions
      set average_cost = ((quantity * average_cost) + (p_quantity * v_quote.last_price)) / (quantity + p_quantity),
          quantity = quantity + p_quantity
      where id = v_position.id;
    end if;
  else
    select * into v_position from public.virtual_positions
    where portfolio_id = p_portfolio_id and security_id = p_security_id for update;
    if v_position.id is null or v_position.quantity < p_quantity then
      update public.virtual_orders set status = 'rejected', reject_reason = 'insufficient quantity' where id = v_order.id
      returning * into v_order;
      return v_order;
    end if;

    update public.virtual_positions
    set quantity = quantity - p_quantity,
        realized_pnl = realized_pnl + ((v_quote.last_price - average_cost) * p_quantity)
    where id = v_position.id;

    update public.market_portfolios
    set current_cash = current_cash + v_cost, updated_at = now()
    where id = p_portfolio_id;
  end if;

  update public.virtual_orders set status = 'filled' where id = v_order.id returning * into v_order;
  return v_order;
end;
$$;

create or replace function public.route_help_request(p_request_id uuid)
returns public.support_matches
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_req public.support_requests;
  v_helper public.helper_profiles;
  v_conversation_id uuid;
  v_match public.support_matches;
  v_expires timestamptz := now() + interval '48 hours';
begin
  select * into v_req from public.support_requests where id = p_request_id for update;
  if v_req.id is null then raise exception 'support request not found'; end if;
  if v_req.status not in ('queued','draft') then raise exception 'request not routable'; end if;

  select hp.* into v_helper
  from public.helper_profiles hp
  where hp.status = 'approved'
    and hp.availability_status = 'available'
    and hp.support_role = v_req.requested_role
    and (v_req.category = any (hp.categories) or cardinality(hp.categories) = 0)
    and hp.user_id is distinct from v_req.requester_id
    and not private.is_blocked(hp.user_id, v_req.requester_id)
  order by hp.approved_at nulls last
  limit 1;

  if v_helper.user_id is null then
    raise exception 'no helper available';
  end if;

  insert into public.conversations (conversation_type, status)
  values ('anonymous_support', 'active')
  returning id into v_conversation_id;

  insert into public.conversation_members (conversation_id, user_id, alias, role)
  values
    (v_conversation_id, v_req.requester_id, coalesce(v_req.anonymous_alias, 'Seeker'), 'requester'),
    (v_conversation_id, v_helper.user_id, 'Helper', 'helper');

  insert into public.anonymous_channels (
    support_request_id, conversation_id, requester_alias, helper_alias, expires_at
  ) values (
    p_request_id, v_conversation_id,
    coalesce(v_req.anonymous_alias, 'Seeker'), 'Helper', v_expires
  );

  update public.support_requests
  set status = 'matched',
      matched_helper_id = v_helper.user_id,
      conversation_id = v_conversation_id,
      routed_at = now()
  where id = p_request_id;

  insert into public.support_matches (support_request_id, helper_id, conversation_id)
  values (p_request_id, v_helper.user_id, v_conversation_id)
  returning * into v_match;

  return v_match;
end;
$$;

create or replace function public.generate_report_job(
  p_report_type text,
  p_period_start date default null,
  p_period_end date default null
)
returns public.report_jobs
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_uid uuid := auth.uid();
  v_job public.report_jobs;
  v_snapshot jsonb;
begin
  if v_uid is null then raise exception 'authentication required'; end if;

  v_snapshot := jsonb_build_object(
    'xp_total', coalesce((select sum(points) from public.user_xp_events where user_id = v_uid), 0),
    'lessons_completed', coalesce((select count(*) from public.user_lesson_progress where user_id = v_uid and status = 'completed'), 0),
    'streak', coalesce((select current_streak from public.user_streaks where user_id = v_uid), 0),
    'captured_at', now()
  );

  insert into public.report_jobs (owner_id, report_type, period_start, period_end, status, input_snapshot)
  values (v_uid, p_report_type, p_period_start, p_period_end, 'queued', v_snapshot)
  returning * into v_job;

  return v_job;
end;
$$;

create or replace function public.market_data_sync(
  p_provider text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  r jsonb;
  v_security_id uuid;
  v_upserted int := 0;
begin
  if auth.uid() is not null
     and not private.has_staff_role(auth.uid(), 'admin')
     and not private.has_staff_role(auth.uid(), 'content_staff')
     and current_setting('role', true) <> 'service_role' then
    raise exception 'not authorized';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    select id into v_security_id from public.securities where ticker = r->>'ticker' limit 1;
    if v_security_id is null then
      insert into public.securities (ticker, name, exchange, security_type)
      values (r->>'ticker', coalesce(r->>'name', r->>'ticker'), r->>'exchange', coalesce(r->>'security_type','equity'))
      returning id into v_security_id;
    end if;

    insert into public.market_quotes_cache (security_id, last_price, quote_timestamp, delay_label, provider, expires_at)
    values (
      v_security_id,
      (r->>'last_price')::numeric,
      coalesce((r->>'quote_timestamp')::timestamptz, now()),
      coalesce(r->>'delay_label', 'delayed'),
      p_provider,
      coalesce((r->>'expires_at')::timestamptz, now() + interval '15 minutes')
    )
    on conflict (security_id) do update set
      last_price = excluded.last_price,
      quote_timestamp = excluded.quote_timestamp,
      delay_label = excluded.delay_label,
      provider = excluded.provider,
      expires_at = excluded.expires_at,
      updated_at = now();

    if r ? 'price_date' then
      insert into public.market_prices_daily (
        security_id, price_date, open, high, low, close, adjusted_close, volume, provider
      ) values (
        v_security_id,
        (r->>'price_date')::date,
        nullif(r->>'open','')::numeric,
        nullif(r->>'high','')::numeric,
        nullif(r->>'low','')::numeric,
        nullif(r->>'close','')::numeric,
        nullif(r->>'adjusted_close','')::numeric,
        nullif(r->>'volume','')::bigint,
        p_provider
      )
      on conflict (security_id, price_date, provider) do update set
        open = excluded.open,
        high = excluded.high,
        low = excluded.low,
        close = excluded.close,
        adjusted_close = excluded.adjusted_close,
        volume = excluded.volume,
        fetched_at = now();
    end if;

    v_upserted := v_upserted + 1;
  end loop;

  insert into public.market_data_freshness (provider, last_sync_at, status, detail)
  values (p_provider, now(), 'ok', jsonb_build_object('upserted', v_upserted))
  on conflict (provider) do update set
    last_sync_at = now(),
    status = 'ok',
    detail = excluded.detail;

  return jsonb_build_object('upserted', v_upserted, 'provider', p_provider);
end;
$$;

create or replace function public.retention_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_channels int;
  v_queue int;
  v_draft_notes int;
begin
  update public.anonymous_channels
  set status = 'expired'
  where status = 'active' and expires_at < now();
  get diagnostics v_channels = row_count;

  update public.notification_queue
  set status = 'cancelled'
  where status = 'pending' and scheduled_for < now() - interval '30 days';
  get diagnostics v_queue = row_count;

  -- Mark stale draft notes for cleanup (imports-temp object purge uses Storage API / edge job)
  update public.notes
  set status = 'archived'
  where status = 'draft'
    and seal_state = 'draft'
    and updated_at < now() - interval '90 days';
  get diagnostics v_draft_notes = row_count;

  insert into private.audit_events (actor_id, action, resource_type, resource_id, metadata)
  values (
    auth.uid(),
    'retention_cleanup',
    'system',
    null,
    jsonb_build_object(
      'expired_channels', v_channels,
      'cancelled_queue', v_queue,
      'archived_draft_notes', v_draft_notes,
      'imports_temp_note', 'purge via Storage API edge job'
    )
  );

  return jsonb_build_object(
    'expired_channels', v_channels,
    'cancelled_notifications', v_queue,
    'archived_draft_notes', v_draft_notes
  );
end;
$$;

revoke all on function public.award_xp(uuid,text,int,text,text,uuid,uuid,text) from public;
revoke all on function public.complete_lesson(uuid) from public;
revoke all on function public.seal_note(uuid,timestamptz,text) from public;
revoke all on function public.execute_virtual_order(uuid,uuid,text,numeric) from public;
revoke all on function public.route_help_request(uuid) from public;
revoke all on function public.generate_report_job(text,date,date) from public;
revoke all on function public.market_data_sync(text,jsonb) from public;
revoke all on function public.retention_cleanup() from public;

grant execute on function public.award_xp(uuid,text,int,text,text,uuid,uuid,text) to authenticated, service_role;
grant execute on function public.complete_lesson(uuid) to authenticated;
grant execute on function public.seal_note(uuid,timestamptz,text) to authenticated;
grant execute on function public.execute_virtual_order(uuid,uuid,text,numeric) to authenticated;
grant execute on function public.route_help_request(uuid) to authenticated, service_role;
grant execute on function public.generate_report_job(text,date,date) to authenticated;
grant execute on function public.market_data_sync(text,jsonb) to authenticated, service_role;
grant execute on function public.retention_cleanup() to service_role;

-- ========== ENABLE RLS ==========
alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_roles enable row level security;
alter table public.onboarding_state enable row level security;
alter table public.invites enable row level security;
alter table public.relationships enable row level security;
alter table public.blocked_relationships enable row level security;
alter table public.consent_events enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_follows enable row level security;
alter table public.community_saves enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_join_requests enable row level security;
alter table public.circle_challenges enable row level security;
alter table public.circle_contributions enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_attachments enable row level security;
alter table public.shared_inbox_items enable row level security;
alter table public.helper_profiles enable row level security;
alter table public.support_requests enable row level security;
alter table public.support_matches enable row level security;
alter table public.anonymous_channels enable row level security;
alter table public.support_feedback enable row level security;
alter table public.academy_modules enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.lesson_cards enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.lesson_games enable row level security;
alter table public.lesson_game_choices enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.user_game_attempts enable row level security;
alter table public.user_xp_events enable row level security;
alter table public.user_streaks enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.content_tags enable row level security;
alter table public.content_tag_links enable row level security;
alter table public.content_versions enable row level security;
alter table public.missions enable row level security;
alter table public.mission_proof_submissions enable row level security;
alter table public.protocols enable row level security;
alter table public.protocol_phases enable row level security;
alter table public.protocol_days enable row level security;
alter table public.user_protocols enable row level security;
alter table public.user_missions enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.notes enable row level security;
alter table public.note_revisions enable row level security;
alter table public.note_attachments enable row level security;
alter table public.books enable row level security;
alter table public.book_contributions enable row level security;
alter table public.book_contribution_consents enable row level security;
alter table public.couples enable row level security;
alter table public.couple_answers enable row level security;
alter table public.reveal_states enable row level security;
alter table public.meetings enable row level security;
alter table public.decisions enable row level security;
alter table public.covenants enable row level security;
alter table public.securities enable row level security;
alter table public.market_prices_daily enable row level security;
alter table public.market_quotes_cache enable row level security;
alter table public.filings enable row level security;
alter table public.investment_theses enable row level security;
alter table public.market_portfolios enable row level security;
alter table public.virtual_orders enable row level security;
alter table public.virtual_positions enable row level security;
alter table public.market_data_freshness enable row level security;
alter table public.games enable row level security;
alter table public.game_scenarios enable row level security;
alter table public.game_choices enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_session_answers enable row level security;
alter table public.game_badges enable row level security;
alter table public.user_game_badges enable row level security;
alter table public.couple_game_sessions enable row level security;
alter table public.daily_game_challenges enable row level security;
alter table public.billing_customers enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_seats enable row level security;
alter table public.entitlements enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.safety_reports enable row level security;
alter table public.appeals enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_queue enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.analytics_events enable row level security;
alter table public.experiment_assignments enable row level security;
alter table public.report_jobs enable row level security;

alter table private.professional_credentials enable row level security;
alter table private.webhook_events enable row level security;
alter table private.moderation_cases enable row level security;
alter table private.moderation_actions enable row level security;
alter table private.credential_events enable row level security;
alter table private.audit_events enable row level security;
alter table private.admin_audit_log enable row level security;

-- ========== POLICIES (drop/create safe) ==========
-- Profiles
drop policy if exists profiles_owner_read on public.profiles;
create policy profiles_owner_read on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists profiles_audience_read on public.profiles;
create policy profiles_audience_read on public.profiles
for select to authenticated using (
  id <> auth.uid()
  and account_status = 'active'
  and deleted_at is null
  and not private.is_blocked(auth.uid(), id)
  and (
    visibility = 'public'
    or (visibility = 'community' and discoverable = true)
    or (visibility = 'connections' and private.is_accepted_connection(auth.uid(), id))
  )
);

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists onboarding_owner_all on public.onboarding_state;
create policy onboarding_owner_all on public.onboarding_state
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_preferences_owner_all on public.user_preferences;
create policy user_preferences_owner_all on public.user_preferences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_roles_self_read on public.user_roles;
create policy user_roles_self_read on public.user_roles
for select to authenticated using (user_id = auth.uid() or private.has_staff_role(auth.uid(), 'admin'));

-- Relationships / blocks / invites / consents
drop policy if exists relationships_participant_read on public.relationships;
create policy relationships_participant_read on public.relationships
for select to authenticated using (auth.uid() in (requester_id, recipient_id));

drop policy if exists relationships_request_create on public.relationships;
create policy relationships_request_create on public.relationships
for insert to authenticated with check (
  requester_id = auth.uid()
  and requester_id <> recipient_id
  and status = 'pending'
  and not private.is_blocked(requester_id, recipient_id)
);

drop policy if exists relationships_participant_update on public.relationships;
create policy relationships_participant_update on public.relationships
for update to authenticated
using (auth.uid() in (requester_id, recipient_id))
with check (auth.uid() in (requester_id, recipient_id));

drop policy if exists blocks_owner_all on public.blocked_relationships;
create policy blocks_owner_all on public.blocked_relationships
for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists invites_sender_read on public.invites;
create policy invites_sender_read on public.invites
for select to authenticated using (inviter_id = auth.uid() or accepted_by = auth.uid());

drop policy if exists invites_sender_insert on public.invites;
create policy invites_sender_insert on public.invites
for insert to authenticated with check (inviter_id = auth.uid());

drop policy if exists consents_owner_read on public.consent_events;
create policy consents_owner_read on public.consent_events
for select to authenticated using (user_id = auth.uid());

drop policy if exists consents_owner_insert on public.consent_events;
create policy consents_owner_insert on public.consent_events
for insert to authenticated with check (user_id = auth.uid());

-- Community
drop policy if exists posts_author_insert on public.community_posts;
create policy posts_author_insert on public.community_posts
for insert to authenticated with check (
  author_id = auth.uid()
  and (
    (audience in ('community','connections') and circle_id is null)
    or (audience = 'circle' and circle_id is not null and private.is_circle_member(circle_id))
  )
);

drop policy if exists posts_audience_read on public.community_posts;
create policy posts_audience_read on public.community_posts
for select to authenticated using (
  moderation_status = 'visible'
  and not private.is_blocked(auth.uid(), author_id)
  and (
    author_id = auth.uid()
    or audience = 'community'
    or (audience = 'connections' and private.is_accepted_connection(auth.uid(), author_id))
    or (audience = 'circle' and private.is_circle_member(circle_id))
  )
);

drop policy if exists posts_author_update on public.community_posts;
create policy posts_author_update on public.community_posts
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists comments_readable on public.community_comments;
create policy comments_readable on public.community_comments
for select to authenticated using (
  exists (
    select 1 from public.community_posts p
    where p.id = post_id and (
      p.author_id = auth.uid()
      or p.audience = 'community'
      or (p.audience = 'connections' and private.is_accepted_connection(auth.uid(), p.author_id))
      or (p.audience = 'circle' and private.is_circle_member(p.circle_id))
    ) and p.moderation_status = 'visible'
  )
);

drop policy if exists comments_insert on public.community_comments;
create policy comments_insert on public.community_comments
for insert to authenticated with check (author_id = auth.uid());

drop policy if exists reactions_owner on public.community_reactions;
create policy reactions_owner on public.community_reactions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists follows_owner on public.community_follows;
create policy follows_owner on public.community_follows
for all to authenticated using (follower_id = auth.uid()) with check (follower_id = auth.uid());

drop policy if exists saves_owner on public.community_saves;
create policy saves_owner on public.community_saves
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Circles
drop policy if exists circles_member_read on public.circles;
create policy circles_member_read on public.circles
for select to authenticated using (
  private.is_circle_member(id) or (visibility = 'discoverable' and status = 'active')
);

drop policy if exists circles_owner_insert on public.circles;
create policy circles_owner_insert on public.circles
for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists circles_leader_update on public.circles;
create policy circles_leader_update on public.circles
for update to authenticated using (private.is_circle_leader(id)) with check (private.is_circle_leader(id));

drop policy if exists circle_members_member_read on public.circle_members;
create policy circle_members_member_read on public.circle_members
for select to authenticated using (private.is_circle_member(circle_id) or user_id = auth.uid());

drop policy if exists circle_contributions_member_read on public.circle_contributions;
create policy circle_contributions_member_read on public.circle_contributions
for select to authenticated using (
  private.is_circle_member(circle_id)
  and (visibility = 'circle' or author_id = auth.uid() or (visibility = 'leaders' and private.is_circle_leader(circle_id)))
);

drop policy if exists circle_contributions_member_insert on public.circle_contributions;
create policy circle_contributions_member_insert on public.circle_contributions
for insert to authenticated with check (
  author_id = auth.uid() and private.is_circle_member(circle_id)
);

drop policy if exists circle_join_requests_self on public.circle_join_requests;
create policy circle_join_requests_self on public.circle_join_requests
for select to authenticated using (user_id = auth.uid() or private.is_circle_leader(circle_id));

drop policy if exists circle_join_requests_insert on public.circle_join_requests;
create policy circle_join_requests_insert on public.circle_join_requests
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists circle_challenges_member_read on public.circle_challenges;
create policy circle_challenges_member_read on public.circle_challenges
for select to authenticated using (private.is_circle_member(circle_id));

-- Messaging
drop policy if exists conversations_member_read on public.conversations;
create policy conversations_member_read on public.conversations
for select to authenticated using (private.is_conversation_member(id));

drop policy if exists conversation_members_self_read on public.conversation_members;
create policy conversation_members_self_read on public.conversation_members
for select to authenticated using (private.is_conversation_member(conversation_id));

drop policy if exists messages_member_read on public.messages;
create policy messages_member_read on public.messages
for select to authenticated using (private.is_conversation_member(conversation_id));

drop policy if exists messages_member_insert on public.messages;
create policy messages_member_insert on public.messages
for insert to authenticated with check (
  sender_id = auth.uid() and private.is_conversation_member(conversation_id)
);

drop policy if exists message_attachments_member_read on public.message_attachments;
create policy message_attachments_member_read on public.message_attachments
for select to authenticated using (
  exists (
    select 1 from public.messages m
    where m.id = message_id and private.is_conversation_member(m.conversation_id)
  )
);

drop policy if exists shared_inbox_member_read on public.shared_inbox_items;
create policy shared_inbox_member_read on public.shared_inbox_items
for select to authenticated using (private.is_circle_member(circle_id));

drop policy if exists shared_inbox_member_insert on public.shared_inbox_items;
create policy shared_inbox_member_insert on public.shared_inbox_items
for insert to authenticated with check (author_id = auth.uid() and private.is_circle_member(circle_id));

-- Support
drop policy if exists helper_profile_owner_read on public.helper_profiles;
create policy helper_profile_owner_read on public.helper_profiles
for select to authenticated using (user_id = auth.uid());

drop policy if exists helper_profile_owner_apply on public.helper_profiles;
create policy helper_profile_owner_apply on public.helper_profiles
for insert to authenticated with check (user_id = auth.uid() and status = 'applicant');

drop policy if exists helper_profile_owner_update on public.helper_profiles;
create policy helper_profile_owner_update on public.helper_profiles
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists support_request_party_read on public.support_requests;
create policy support_request_party_read on public.support_requests
for select to authenticated using (
  requester_id = auth.uid()
  or matched_helper_id = auth.uid()
  or private.has_staff_role(auth.uid(), 'safety_staff')
);

drop policy if exists support_request_owner_insert on public.support_requests;
create policy support_request_owner_insert on public.support_requests
for insert to authenticated with check (requester_id = auth.uid() and matched_helper_id is null);

drop policy if exists support_matches_party_read on public.support_matches;
create policy support_matches_party_read on public.support_matches
for select to authenticated using (
  helper_id = auth.uid()
  or exists (select 1 from public.support_requests r where r.id = support_request_id and r.requester_id = auth.uid())
);

drop policy if exists anonymous_channels_party_read on public.anonymous_channels;
create policy anonymous_channels_party_read on public.anonymous_channels
for select to authenticated using (private.is_conversation_member(conversation_id));

drop policy if exists support_feedback_party on public.support_feedback;
create policy support_feedback_party on public.support_feedback
for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Learning content (published readable)
drop policy if exists academy_modules_read on public.academy_modules;
create policy academy_modules_read on public.academy_modules for select to authenticated using (true);

drop policy if exists academy_lessons_read on public.academy_lessons;
create policy academy_lessons_read on public.academy_lessons for select to authenticated using (status = 'published');

drop policy if exists lesson_cards_read on public.lesson_cards;
create policy lesson_cards_read on public.lesson_cards for select to authenticated using (
  exists (select 1 from public.academy_lessons l where l.id = lesson_id and l.status = 'published')
);

drop policy if exists quiz_questions_read on public.quiz_questions;
create policy quiz_questions_read on public.quiz_questions for select to authenticated using (
  exists (select 1 from public.academy_lessons l where l.id = lesson_id and l.status = 'published')
);

drop policy if exists quiz_options_read on public.quiz_options;
create policy quiz_options_read on public.quiz_options for select to authenticated using (
  exists (
    select 1 from public.quiz_questions q
    join public.academy_lessons l on l.id = q.lesson_id
    where q.id = question_id and l.status = 'published'
  )
);

drop policy if exists lesson_games_read on public.lesson_games;
create policy lesson_games_read on public.lesson_games for select to authenticated using (
  exists (select 1 from public.academy_lessons l where l.id = lesson_id and l.status = 'published')
);

drop policy if exists lesson_game_choices_read on public.lesson_game_choices;
create policy lesson_game_choices_read on public.lesson_game_choices for select to authenticated using (
  exists (
    select 1 from public.lesson_games g
    join public.academy_lessons l on l.id = g.lesson_id
    where g.id = game_id and l.status = 'published'
  )
);

drop policy if exists user_lesson_progress_owner on public.user_lesson_progress;
create policy user_lesson_progress_owner on public.user_lesson_progress
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_quiz_attempts_owner on public.user_quiz_attempts;
create policy user_quiz_attempts_owner on public.user_quiz_attempts
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_game_attempts_owner on public.user_game_attempts;
create policy user_game_attempts_owner on public.user_game_attempts
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_xp_events_owner_read on public.user_xp_events;
create policy user_xp_events_owner_read on public.user_xp_events
for select to authenticated using (user_id = auth.uid());

drop policy if exists user_streaks_owner on public.user_streaks;
create policy user_streaks_owner on public.user_streaks
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges for select to authenticated using (is_active = true);

drop policy if exists user_badges_owner_read on public.user_badges;
create policy user_badges_owner_read on public.user_badges
for select to authenticated using (user_id = auth.uid());

drop policy if exists content_tags_read on public.content_tags;
create policy content_tags_read on public.content_tags for select to authenticated using (true);

drop policy if exists content_tag_links_read on public.content_tag_links;
create policy content_tag_links_read on public.content_tag_links for select to authenticated using (true);

-- Missions/protocols
drop policy if exists missions_read on public.missions;
create policy missions_read on public.missions for select to authenticated using (status = 'published');

drop policy if exists protocols_read on public.protocols;
create policy protocols_read on public.protocols for select to authenticated using (status = 'published');

drop policy if exists protocol_phases_read on public.protocol_phases;
create policy protocol_phases_read on public.protocol_phases for select to authenticated using (true);

drop policy if exists protocol_days_read on public.protocol_days;
create policy protocol_days_read on public.protocol_days for select to authenticated using (true);

drop policy if exists user_protocols_owner on public.user_protocols;
create policy user_protocols_owner on public.user_protocols
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_missions_owner on public.user_missions;
create policy user_missions_owner on public.user_missions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists mission_proof_owner on public.mission_proof_submissions;
create policy mission_proof_owner on public.mission_proof_submissions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists challenges_participant_read on public.challenges;
create policy challenges_participant_read on public.challenges
for select to authenticated using (
  created_by = auth.uid()
  or exists (select 1 from public.challenge_participants cp where cp.challenge_id = id and cp.user_id = auth.uid())
);

drop policy if exists challenge_participants_self on public.challenge_participants;
create policy challenge_participants_self on public.challenge_participants
for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.challenges c where c.id = challenge_id and c.created_by = auth.uid())
);

-- Notes / books
drop policy if exists notes_owner_all on public.notes;
create policy notes_owner_all on public.notes
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists note_revisions_owner on public.note_revisions;
create policy note_revisions_owner on public.note_revisions
for select to authenticated using (
  exists (select 1 from public.notes n where n.id = note_id and n.owner_id = auth.uid())
);

drop policy if exists note_attachments_owner on public.note_attachments;
create policy note_attachments_owner on public.note_attachments
for all to authenticated using (
  exists (select 1 from public.notes n where n.id = note_id and n.owner_id = auth.uid())
) with check (
  exists (select 1 from public.notes n where n.id = note_id and n.owner_id = auth.uid())
);

drop policy if exists books_owner_all on public.books;
create policy books_owner_all on public.books
for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists book_contributions_parties on public.book_contributions;
create policy book_contributions_parties on public.book_contributions
for select to authenticated using (
  contributor_id = auth.uid()
  or exists (select 1 from public.books b where b.id = book_id and b.owner_id = auth.uid())
);

drop policy if exists book_contribution_consents_owner on public.book_contribution_consents;
create policy book_contribution_consents_owner on public.book_contribution_consents
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Couples
drop policy if exists couples_member_all on public.couples;
create policy couples_member_all on public.couples
for select to authenticated using (auth.uid() in (user_a_id, user_b_id));

drop policy if exists couples_member_insert on public.couples;
create policy couples_member_insert on public.couples
for insert to authenticated with check (auth.uid() in (user_a_id, user_b_id));

drop policy if exists couples_member_update on public.couples;
create policy couples_member_update on public.couples
for update to authenticated using (auth.uid() in (user_a_id, user_b_id)) with check (auth.uid() in (user_a_id, user_b_id));

drop policy if exists couple_answers_owner_or_revealed on public.couple_answers;
create policy couple_answers_owner_or_revealed on public.couple_answers
for select to authenticated using (
  private.is_couple_member(couple_id)
  and (
    author_id = auth.uid()
    or share_state = 'revealed'
    or (
      select count(*) = 2 from public.reveal_states rs
      where rs.couple_id = couple_answers.couple_id
        and rs.session_key = couple_answers.session_key
        and rs.ready = true
    )
  )
);

drop policy if exists couple_answers_owner_write on public.couple_answers;
create policy couple_answers_owner_write on public.couple_answers
for insert to authenticated with check (author_id = auth.uid() and private.is_couple_member(couple_id));

drop policy if exists couple_answers_owner_update on public.couple_answers;
create policy couple_answers_owner_update on public.couple_answers
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists reveal_states_member on public.reveal_states;
create policy reveal_states_member on public.reveal_states
for all to authenticated using (user_id = auth.uid() and private.is_couple_member(couple_id))
with check (user_id = auth.uid() and private.is_couple_member(couple_id));

drop policy if exists meetings_member on public.meetings;
create policy meetings_member on public.meetings
for all to authenticated using (private.is_couple_member(couple_id)) with check (private.is_couple_member(couple_id));

drop policy if exists decisions_member on public.decisions;
create policy decisions_member on public.decisions
for all to authenticated using (private.is_couple_member(couple_id)) with check (private.is_couple_member(couple_id));

drop policy if exists covenants_member on public.covenants;
create policy covenants_member on public.covenants
for all to authenticated using (private.is_couple_member(couple_id)) with check (private.is_couple_member(couple_id));

-- Market / games
drop policy if exists securities_read on public.securities;
create policy securities_read on public.securities for select to authenticated using (is_active = true);

drop policy if exists market_prices_read on public.market_prices_daily;
create policy market_prices_read on public.market_prices_daily for select to authenticated using (true);

drop policy if exists market_quotes_read on public.market_quotes_cache;
create policy market_quotes_read on public.market_quotes_cache for select to authenticated using (true);

drop policy if exists filings_read on public.filings;
create policy filings_read on public.filings for select to authenticated using (status = 'published');

drop policy if exists theses_owner on public.investment_theses;
create policy theses_owner on public.investment_theses
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists portfolios_owner on public.market_portfolios;
create policy portfolios_owner on public.market_portfolios
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists virtual_orders_owner on public.virtual_orders;
create policy virtual_orders_owner on public.virtual_orders
for select to authenticated using (user_id = auth.uid());

drop policy if exists virtual_positions_owner on public.virtual_positions;
create policy virtual_positions_owner on public.virtual_positions
for select to authenticated using (
  exists (select 1 from public.market_portfolios p where p.id = portfolio_id and p.user_id = auth.uid())
);

drop policy if exists market_freshness_read on public.market_data_freshness;
create policy market_freshness_read on public.market_data_freshness for select to authenticated using (true);

drop policy if exists games_read on public.games;
create policy games_read on public.games for select to authenticated using (is_active = true);

drop policy if exists game_scenarios_read on public.game_scenarios;
create policy game_scenarios_read on public.game_scenarios for select to authenticated using (active = true);

drop policy if exists game_choices_read on public.game_choices;
create policy game_choices_read on public.game_choices for select to authenticated using (true);

drop policy if exists game_sessions_owner on public.game_sessions;
create policy game_sessions_owner on public.game_sessions
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists game_session_answers_owner on public.game_session_answers;
create policy game_session_answers_owner on public.game_session_answers
for all to authenticated using (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = auth.uid())
);

drop policy if exists game_badges_read on public.game_badges;
create policy game_badges_read on public.game_badges for select to authenticated using (true);

drop policy if exists user_game_badges_owner on public.user_game_badges;
create policy user_game_badges_owner on public.user_game_badges
for select to authenticated using (user_id = auth.uid());

drop policy if exists couple_game_sessions_member on public.couple_game_sessions;
create policy couple_game_sessions_member on public.couple_game_sessions
for select to authenticated using (private.is_couple_member(couple_id));

drop policy if exists daily_game_challenges_read on public.daily_game_challenges;
create policy daily_game_challenges_read on public.daily_game_challenges for select to authenticated using (true);

-- Billing: client read only; no client writes
drop policy if exists billing_customers_owner_read on public.billing_customers;
create policy billing_customers_owner_read on public.billing_customers
for select to authenticated using (user_id = auth.uid());

drop policy if exists plans_read on public.plans;
create policy plans_read on public.plans for select to authenticated using (is_active = true);

drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions
for select to authenticated using (user_id = auth.uid());

drop policy if exists subscription_seats_owner_read on public.subscription_seats;
create policy subscription_seats_owner_read on public.subscription_seats
for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
);

drop policy if exists entitlements_read on public.entitlements;
create policy entitlements_read on public.entitlements for select to authenticated using (true);

drop policy if exists plan_entitlements_read on public.plan_entitlements;
create policy plan_entitlements_read on public.plan_entitlements for select to authenticated using (true);

drop policy if exists user_entitlements_owner_read on public.user_entitlements;
create policy user_entitlements_owner_read on public.user_entitlements
for select to authenticated using (user_id = auth.uid());

-- Safety: reporters can insert/read own reports; staff only for private tables (no client policies on private.*)
drop policy if exists safety_reports_owner on public.safety_reports;
create policy safety_reports_owner on public.safety_reports
for select to authenticated using (
  reporter_id = auth.uid() or private.has_staff_role(auth.uid(), 'safety_staff')
);

drop policy if exists safety_reports_insert on public.safety_reports;
create policy safety_reports_insert on public.safety_reports
for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists appeals_owner on public.appeals;
create policy appeals_owner on public.appeals
for select to authenticated using (
  appellant_id = auth.uid() or private.has_staff_role(auth.uid(), 'safety_staff')
);

drop policy if exists appeals_insert on public.appeals;
create policy appeals_insert on public.appeals
for insert to authenticated with check (appellant_id = auth.uid());

-- Notifications / analytics
drop policy if exists notification_preferences_owner on public.notification_preferences;
create policy notification_preferences_owner on public.notification_preferences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notification_queue_owner_read on public.notification_queue;
create policy notification_queue_owner_read on public.notification_queue
for select to authenticated using (user_id = auth.uid());

drop policy if exists notification_deliveries_owner_read on public.notification_deliveries;
create policy notification_deliveries_owner_read on public.notification_deliveries
for select to authenticated using (
  exists (select 1 from public.notification_queue q where q.id = queue_id and q.user_id = auth.uid())
);

drop policy if exists analytics_events_owner_insert on public.analytics_events;
create policy analytics_events_owner_insert on public.analytics_events
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists analytics_events_owner_read on public.analytics_events;
create policy analytics_events_owner_read on public.analytics_events
for select to authenticated using (user_id = auth.uid());

drop policy if exists experiment_assignments_owner on public.experiment_assignments;
create policy experiment_assignments_owner on public.experiment_assignments
for select to authenticated using (user_id = auth.uid());

drop policy if exists report_jobs_owner on public.report_jobs;
create policy report_jobs_owner on public.report_jobs
for select to authenticated using (owner_id = auth.uid());

-- Private schema: no grants to authenticated (service role only)
revoke all on all tables in schema private from anon, authenticated;
grant usage on schema private to service_role;
grant all on all tables in schema private to service_role;

-- ========== STORAGE BUCKETS (Doc 04 / prompt exact 8) ==========
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-content', 'public-content', true, 52428800, null),
  ('user-private', 'user-private', false, 52428800, null),
  ('voice-private', 'voice-private', false, 104857600, array['audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg']),
  ('video-private', 'video-private', false, 524288000, array['video/mp4','video/webm','video/quicktime']),
  ('circle-approved', 'circle-approved', false, 52428800, null),
  ('journey-books', 'journey-books', false, 104857600, array['application/pdf','image/png','image/jpeg']),
  ('admin-evidence', 'admin-evidence', false, 104857600, null),
  ('imports-temp', 'imports-temp', false, 104857600, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists public_content_read on storage.objects;
create policy public_content_read on storage.objects
for select to public using (bucket_id = 'public-content');

drop policy if exists public_content_staff_write on storage.objects;
create policy public_content_staff_write on storage.objects
for insert to authenticated with check (
  bucket_id = 'public-content'
  and (private.has_staff_role(auth.uid(), 'content_staff') or private.has_staff_role(auth.uid(), 'admin'))
);

drop policy if exists user_private_owner on storage.objects;
create policy user_private_owner on storage.objects
for all to authenticated using (
  bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'user-private' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists voice_private_owner on storage.objects;
create policy voice_private_owner on storage.objects
for all to authenticated using (
  bucket_id = 'voice-private' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'voice-private' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists video_private_owner on storage.objects;
create policy video_private_owner on storage.objects
for all to authenticated using (
  bucket_id = 'video-private' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'video-private' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists circle_approved_member_read on storage.objects;
create policy circle_approved_member_read on storage.objects
for select to authenticated using (
  bucket_id = 'circle-approved'
  and private.is_circle_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists circle_approved_member_write on storage.objects;
create policy circle_approved_member_write on storage.objects
for insert to authenticated with check (
  bucket_id = 'circle-approved'
  and private.is_circle_member(((storage.foldername(name))[1])::uuid)
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists journey_books_owner on storage.objects;
create policy journey_books_owner on storage.objects
for all to authenticated using (
  bucket_id = 'journey-books' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'journey-books' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists admin_evidence_staff on storage.objects;
create policy admin_evidence_staff on storage.objects
for select to authenticated using (
  bucket_id = 'admin-evidence'
  and (private.has_staff_role(auth.uid(), 'safety_staff') or private.has_staff_role(auth.uid(), 'admin'))
);

-- imports-temp: no authenticated policies (admin/service only)
drop policy if exists imports_temp_staff on storage.objects;
create policy imports_temp_staff on storage.objects
for all to authenticated using (
  bucket_id = 'imports-temp'
  and private.has_staff_role(auth.uid(), 'admin')
) with check (
  bucket_id = 'imports-temp'
  and private.has_staff_role(auth.uid(), 'admin')
);
