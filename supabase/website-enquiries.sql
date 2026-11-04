create table if not exists public.website_enquiries (
 id uuid primary key,
 created_at timestamptz not null default now(),
 kind text not null check (kind in ('contact','quotation')),
 payload jsonb not null,
 client_hash text not null,
 admin_email_status text not null default 'pending' check (admin_email_status in ('pending','accepted')),
 admin_email_id text,
 admin_email_accepted_at timestamptz,
 confirmation_email_status text not null default 'pending' check (confirmation_email_status in ('pending','accepted')),
 confirmation_email_id text,
 confirmation_email_accepted_at timestamptz
);
create table if not exists public.website_enquiry_items (
 enquiry_id uuid not null references public.website_enquiries(id) on delete cascade,
 product_id text not null,
 product_name text not null,
 category text not null,
 quantity integer not null check (quantity between 1 and 999),
 primary key(enquiry_id,product_id)
);
create table if not exists public.website_enquiry_rate_limits (
 client_hash text primary key,
 window_started_at timestamptz not null,
 attempts integer not null
);
alter table public.website_enquiries enable row level security;
alter table public.website_enquiry_items enable row level security;
alter table public.website_enquiry_rate_limits enable row level security;
revoke all on public.website_enquiries,public.website_enquiry_items,public.website_enquiry_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.website_enquiries,public.website_enquiry_items,public.website_enquiry_rate_limits to service_role;
create index if not exists website_enquiries_created_at_idx on public.website_enquiries(created_at desc);

create or replace function public.create_website_enquiry(p_id uuid,p_kind text,p_payload jsonb,p_client_hash text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 existing public.website_enquiries%rowtype;
 limiter public.website_enquiry_rate_limits%rowtype;
begin
 if p_kind not in ('contact','quotation') then raise exception 'INVALID_KIND'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_client_hash,0));
 select * into existing from public.website_enquiries where id=p_id;
 if found then
  if existing.kind<>p_kind or existing.payload<>p_payload or existing.client_hash<>p_client_hash then raise exception 'REQUEST_CONFLICT'; end if;
  if existing.admin_email_status='accepted' and existing.confirmation_email_status='accepted' then return to_jsonb(existing); end if;
 end if;
 insert into public.website_enquiry_rate_limits(client_hash,window_started_at,attempts) values(p_client_hash,now(),1)
 on conflict(client_hash) do update set
  attempts=case when website_enquiry_rate_limits.window_started_at<now()-interval '1 hour' then 1 else website_enquiry_rate_limits.attempts+1 end,
  window_started_at=case when website_enquiry_rate_limits.window_started_at<now()-interval '1 hour' then now() else website_enquiry_rate_limits.window_started_at end
 returning * into limiter;
 if limiter.attempts>20 then raise exception 'RATE_LIMITED'; end if;
 if existing.id is not null then return to_jsonb(existing); end if;
 insert into public.website_enquiries(id,kind,payload,client_hash) values(p_id,p_kind,p_payload,p_client_hash) returning * into existing;
 if p_kind='quotation' then
  insert into public.website_enquiry_items(enquiry_id,product_id,product_name,category,quantity)
  select p_id,item->>'id',item->>'name',item->>'category',(item->>'quantity')::integer
  from jsonb_array_elements(p_payload->'items') as item;
 end if;
 return to_jsonb(existing);
end;
$$;
revoke all on function public.create_website_enquiry(uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_website_enquiry(uuid,text,jsonb,text) to service_role;
