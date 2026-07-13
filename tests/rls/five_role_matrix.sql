-- Five-role RLS matrix (Prompt 1 pattern) for CI ephemeral DB.
-- Roles: owner, authorized participant, unauthorized authenticated, blocked, staff.
-- Expectations live in a DO-local jsonb (not a temp table) so SET ROLE authenticated still works.

begin;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
grant execute on all functions in schema public to authenticated;

do $$
declare
  owner_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  partner_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
  stranger_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
  blocked_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4';
  staff_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5';
  note_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
  couple_id uuid := 'cccccccc-cccc-cccc-cccc-ccccccccccc1';
  ans_id uuid := 'dddddddd-dddd-dddd-dddd-ddddddddddd1';
  circle_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1';
  contrib_id uuid := 'ffffffff-ffff-ffff-ffff-fffffffffff1';
  req_id uuid := '11111111-1111-1111-1111-111111111111';
  cust_id uuid := '22222222-2222-2222-2222-222222222221';
  roles uuid[] := array[owner_id, partner_id, stranger_id, blocked_id, staff_id];
  names text[] := array['owner','participant','unauthorized','blocked','staff'];
  expectations jsonb := '{
    "owner":{"profiles":true,"notes":true,"couple_answers":true,"circle_contributions":true,"support_requests":true,"subscriptions":true,"entitlements":true},
    "participant":{"profiles":true,"notes":false,"couple_answers":false,"circle_contributions":true,"support_requests":false,"subscriptions":false,"entitlements":true},
    "unauthorized":{"profiles":true,"notes":false,"couple_answers":false,"circle_contributions":false,"support_requests":false,"subscriptions":false,"entitlements":true},
    "blocked":{"profiles":false,"notes":false,"couple_answers":false,"circle_contributions":false,"support_requests":false,"subscriptions":false,"entitlements":true},
    "staff":{"profiles":true,"notes":false,"couple_answers":false,"circle_contributions":false,"support_requests":true,"subscriptions":false,"entitlements":true}
  }'::jsonb;
  i int;
  uid uuid;
  rname text;
  seen boolean;
  write_denied boolean;
  exp boolean;
  failures int := 0;
  detail text := '';
  tables text[] := array['profiles','notes','couple_answers','circle_contributions','support_requests','subscriptions','entitlements'];
  tname text;
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  values
    (owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_owner@test.local', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (partner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_partner@test.local', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (stranger_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_stranger@test.local', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (blocked_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_blocked@test.local', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()),
    (staff_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls_staff@test.local', crypt('x', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name, visibility, account_status)
  values
    (owner_id, 'Owner', 'public', 'active'),
    (partner_id, 'Partner', 'public', 'active'),
    (stranger_id, 'Stranger', 'public', 'active'),
    (blocked_id, 'Blocked', 'public', 'active'),
    (staff_id, 'Staff', 'public', 'active')
  on conflict (id) do update set display_name = excluded.display_name, visibility = excluded.visibility, account_status = excluded.account_status;

  insert into public.user_roles (user_id, role) values
    (staff_id, 'admin'),
    (staff_id, 'safety_staff')
  on conflict do nothing;

  insert into public.blocked_relationships (blocker_id, blocked_id, reason_code)
  values (owner_id, blocked_id, 'ci-test')
  on conflict do nothing;

  insert into public.notes (id, owner_id, title, body, privacy_state, status)
  values (note_id, owner_id, 'Owner Note', '{"t":"x"}'::jsonb, 'private', 'active')
  on conflict (id) do nothing;

  insert into public.couples (id, user_a_id, user_b_id, status)
  values (couple_id, owner_id, partner_id, 'active')
  on conflict (id) do nothing;

  insert into public.couple_answers (id, couple_id, session_key, prompt_key, author_id, answer_body, share_state)
  values (ans_id, couple_id, 's1', 'p1', owner_id, '{"a":1}'::jsonb, 'private')
  on conflict (id) do nothing;

  insert into public.circles (id, owner_id, name, purpose, visibility, member_limit, status)
  values (circle_id, owner_id, 'CI Circle', 'test', 'private', 10, 'active')
  on conflict (id) do nothing;

  insert into public.circle_members (circle_id, user_id, role, status)
  values
    (circle_id, owner_id, 'leader', 'active'),
    (circle_id, partner_id, 'member', 'active')
  on conflict do nothing;

  insert into public.circle_contributions (id, circle_id, author_id, contribution_type, body, visibility)
  values (contrib_id, circle_id, partner_id, 'update', 'hello', 'circle')
  on conflict (id) do nothing;

  insert into public.support_requests (id, requester_id, requested_role, category, status)
  values (req_id, owner_id, 'support_friend', 'general', 'queued')
  on conflict (id) do nothing;

  insert into public.billing_customers (id, user_id, billing_provider, provider_customer_id)
  values (cust_id, owner_id, 'stripe', 'cus_ci_owner')
  on conflict (id) do nothing;

  insert into public.subscriptions (
    id, user_id, customer_id, billing_provider, provider_subscription_id, status, plan_key
  ) values (
    '22222222-2222-2222-2222-222222222222', owner_id, cust_id, 'stripe', 'sub_ci_owner', 'active', 'pro'
  ) on conflict (billing_provider, provider_subscription_id) do nothing;

  insert into public.entitlements (id, entitlement_key, description)
  values ('33333333-3333-3333-3333-333333333333', 'feature.pro', 'Pro feature')
  on conflict (id) do nothing;

  for i in 1..5 loop
    uid := roles[i];
    rname := names[i];
    perform set_config('request.jwt.claim.sub', uid::text, true);
    perform set_config(
      'request.jwt.claims',
      json_build_object('sub', uid::text, 'role', 'authenticated')::text,
      true
    );
    execute 'set local role authenticated';

    select exists(select 1 from public.profiles where id = owner_id) into seen;
    exp := (expectations -> rname ->> 'profiles')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.profiles saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.notes where id = note_id) into seen;
    exp := (expectations -> rname ->> 'notes')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.notes saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.couple_answers where id = ans_id) into seen;
    exp := (expectations -> rname ->> 'couple_answers')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.couple_answers saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.circle_contributions where id = contrib_id) into seen;
    exp := (expectations -> rname ->> 'circle_contributions')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.circle_contributions saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.support_requests where id = req_id) into seen;
    exp := (expectations -> rname ->> 'support_requests')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.support_requests saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.subscriptions where user_id = owner_id) into seen;
    exp := (expectations -> rname ->> 'subscriptions')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.subscriptions saw=%s expected=%s;', rname, seen, exp);
    end if;

    select exists(select 1 from public.entitlements where entitlement_key = 'feature.pro') into seen;
    exp := (expectations -> rname ->> 'entitlements')::boolean;
    if seen is distinct from exp then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.entitlements saw=%s expected=%s;', rname, seen, exp);
    end if;

    begin
      insert into public.subscriptions (
        user_id, customer_id, billing_provider, provider_subscription_id, status, plan_key
      ) values (
        uid, cust_id, 'stripe', 'sub_write_' || rname, 'active', 'hack'
      );
      write_denied := false;
      delete from public.subscriptions where provider_subscription_id = 'sub_write_' || rname;
    exception when others then
      write_denied := true;
    end;
    if write_denied is not true then
      failures := failures + 1;
      detail := detail || format(' FAIL %s.subscriptions_write expected denied;', rname);
    end if;

    execute 'reset role';
  end loop;

  if failures > 0 then
    raise exception 'RLS five-role matrix failed (%): %', failures, detail;
  end if;

  raise notice 'RLS_OK: five-role matrix passed for 7 tables';
end $$;

commit;
