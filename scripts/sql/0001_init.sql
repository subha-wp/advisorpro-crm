-- Enable required extensions for UUIDs if available
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'plan') then
    create type plan as enum ('FREE','PREMIUM','PENDING');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('OWNER','AGENT','VIEWER');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'channel') then
    create type channel as enum ('email','whatsapp');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'policy_status') then
    create type policy_status as enum ('ACTIVE','LAPSED','MATURED','SURRENDERED');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type payment_method as enum ('RAZORPAY','MANUAL','CASHFREE','PAYU');
  end if;
end $$;

-- Tables
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  phone text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references users(id),
  plan plan not null default 'FREE',
  payment_method payment_method,
  payment_ref text,
  created_at timestamptz not null default now()
);
create index if not exists idx_workspaces_owner on workspaces(owner_id);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  role role not null
);
create unique index if not exists uq_membership_user_workspace on memberships(user_id, workspace_id);
create index if not exists idx_memberships_workspace on memberships(workspace_id);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  assigned_to_user_id uuid references users(id),
  name text not null,
  dob date,
  mobile text,
  email text,
  address text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_clients_workspace on clients(workspace_id);
create index if not exists idx_clients_deleted on clients(deleted_at);

create table if not exists policies (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  insurer text not null,
  plan_name text,
  policy_number text not null unique,
  sum_assured numeric(14,2),
  premium_amount numeric(12,2),
  premium_mode text,
  next_due_date date,
  last_paid_date date,
  maturity_date date,
  status policy_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_policies_client on policies(client_id);
create index if not exists idx_policies_next_due on policies(next_due_date);

create table if not exists reminder_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  channel channel not null,
  subject text,
  body text not null,
  variables text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_templates_workspace on reminder_templates(workspace_id);

create table if not exists reminder_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid references clients(id),
  policy_id uuid references policies(id),
  template_id uuid references reminder_templates(id),
  channel channel not null,
  "to" text not null,
  status text not null,
  error text,
  sent_at timestamptz not null default now()
);
create index if not exists idx_reminder_logs_workspace on reminder_logs(workspace_id);
create index if not exists idx_reminder_logs_client on reminder_logs(client_id);
create index if not exists idx_reminder_logs_policy on reminder_logs(policy_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references users(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  diff_json jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_workspace on audit_logs(workspace_id);
create index if not exists idx_audit_user on audit_logs(user_id);

create table if not exists billing_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  plan_before plan not null,
  plan_after plan not null,
  payment_method payment_method not null,
  payment_ref text,
  verified_by_admin boolean,
  created_at timestamptz not null default now()
);
create index if not exists idx_billing_workspace on billing_logs(workspace_id);
