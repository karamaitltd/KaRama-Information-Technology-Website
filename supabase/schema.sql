-- Run once in the Supabase SQL Editor before enabling the quotation API.
-- Data is accessible only to the server secret key / service_role, never visitors.
create table if not exists public.quotation_requests (
 id uuid primary key,
 created_at timestamptz not null default now(),
 payload jsonb not null,
 client_hash text not null,
 email_status text not null default 'pending' check (email_status in ('pending','accepted')),
 email_id text,
 email_accepted_at timestamptz
);
create table if not exists public.quotation_rate_limits (
 client_hash text primary key,
 window_started_at timestamptz not null,
 attempts integer not null
);
alter table public.quotation_requests enable row level security;
alter table public.quotation_rate_limits enable row level security;
revoke all on public.quotation_requests, public.quotation_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.quotation_requests, public.quotation_rate_limits to service_role;

create or replace function public.create_quotation_request(p_id uuid, p_payload jsonb, p_client_hash text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
 existing public.quotation_requests%rowtype;
 limiter public.quotation_rate_limits%rowtype;
begin
 -- Serialize requests for the same network across serverless instances.
 perform pg_advisory_xact_lock(hashtextextended(p_client_hash, 0));
 select * into existing from public.quotation_requests where id = p_id;
 if found then
  if existing.payload <> p_payload or existing.client_hash <> p_client_hash then
   raise exception 'REQUEST_CONFLICT';
  end if;
  if existing.email_status = 'accepted' then return to_jsonb(existing); end if;
 end if;
 insert into public.quotation_rate_limits(client_hash, window_started_at, attempts)
 values(p_client_hash, now(), 1)
 on conflict (client_hash) do update set
  attempts = case when quotation_rate_limits.window_started_at < now() - interval '1 hour' then 1 else quotation_rate_limits.attempts + 1 end,
  window_started_at = case when quotation_rate_limits.window_started_at < now() - interval '1 hour' then now() else quotation_rate_limits.window_started_at end
 returning * into limiter;
 if limiter.attempts > 20 then raise exception 'RATE_LIMITED'; end if;
 if existing.id is not null then return to_jsonb(existing); end if;
 insert into public.quotation_requests(id,payload,client_hash) values(p_id,p_payload,p_client_hash)
 returning * into existing;
 return to_jsonb(existing);
end;
$$;
revoke all on function public.create_quotation_request(uuid,jsonb,text) from public, anon, authenticated;
grant execute on function public.create_quotation_request(uuid,jsonb,text) to service_role;
