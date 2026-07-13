-- 0001_extensions_types
-- Extensions, enums, private schema

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create schema if not exists private;

-- Core enums
do $$ begin
  create type public.profile_visibility as enum ('public','community','connections','private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.relationship_type as enum ('partner','friend','family','business','accountability','follow');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.circle_visibility as enum ('private','discoverable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.circle_role as enum ('owner','leader','member','helper','read_only');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_role as enum ('support_friend','verified_professional','pastor','financial_mentor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_status as enum ('draft','queued','matched','active','closed','cancelled','escalated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.staff_role as enum (
    'content_staff','safety_staff','credential_staff','billing_staff','admin','moderator'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invite_type as enum ('partner','person','circle','challenge','event','helper');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invite_status as enum ('pending','opened','accepted','declined','expired','revoked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.share_state as enum ('private','ready_to_reveal','revealed','shared','excluded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.note_seal_state as enum ('draft','submitted','sealed','unlocked','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_provider as enum ('stripe','manual','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'
  );
exception when duplicate_object then null; end $$;

-- Shared updated_at trigger helper
create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
