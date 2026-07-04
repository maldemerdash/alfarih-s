create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.app_user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  role text not null default 'employee' check (role in ('admin', 'hr', 'accountant', 'manager', 'employee')),
  is_active boolean not null default true,
  employee_id uuid,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_user_profiles_updated_at
before update on public.app_user_profiles
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.app_user_profiles
      where user_id = auth.uid()
        and is_active = true
      limit 1
    ),
    'employee'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_app_role() = 'admin';
$$;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_no text unique,
  first_name text not null,
  father_name text,
  family_name text not null,
  national_id text,
  phone text,
  email text,
  department text,
  role_title text,
  status text not null default 'active' check (status in ('active', 'leave', 'travel', 'suspended', 'terminated')),
  start_date date,
  base_salary numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  attachment_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

alter table public.app_user_profiles
  add constraint app_user_profiles_employee_id_fk
  foreign key (employee_id) references public.employees(id) on delete set null;

create table if not exists public.attendance_absences (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  absence_type text not null default 'unexcused',
  period_segment text not null default 'full_day',
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger attendance_absences_updated_at
before update on public.attendance_absences
for each row execute function public.set_updated_at();

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  request_type text not null default 'leave' check (request_type in ('leave', 'travel')),
  leave_type text,
  from_date date not null,
  to_date date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'closed')),
  note text,
  created_by uuid references auth.users(id),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leave_requests_updated_at
before update on public.leave_requests
for each row execute function public.set_updated_at();

create table if not exists public.finance_daily_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  entry_type text not null check (entry_type in ('pending', 'expense', 'cash_sale', 'card_sale', 'advance', 'budget', 'manual_cash')),
  amount numeric(12,2) not null default 0,
  description text,
  employee_id uuid references public.employees(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger finance_daily_entries_updated_at
before update on public.finance_daily_entries
for each row execute function public.set_updated_at();

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_month date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid', 'cancelled')),
  totals jsonb not null default '{}'::jsonb,
  lines jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payroll_runs_updated_at
before update on public.payroll_runs
for each row execute function public.set_updated_at();

create table if not exists public.establishment_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  document_no text,
  category text,
  authority text,
  starts_on date,
  expires_on date,
  attachment_path text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger establishment_documents_updated_at
before update on public.establishment_documents
for each row execute function public.set_updated_at();

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  storage_path text not null,
  related_table text not null,
  related_id uuid,
  file_name text,
  file_type text,
  file_size bigint,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists employees_status_idx on public.employees(status);
create index if not exists employees_department_idx on public.employees(department);
create index if not exists app_user_profiles_user_id_idx on public.app_user_profiles(user_id);
create index if not exists app_user_profiles_email_idx on public.app_user_profiles(lower(email));
create index if not exists leave_requests_employee_id_idx on public.leave_requests(employee_id);
create index if not exists attendance_absences_employee_id_idx on public.attendance_absences(employee_id);
create index if not exists finance_daily_entries_date_idx on public.finance_daily_entries(entry_date);
create index if not exists attachments_related_idx on public.attachments(related_table, related_id);

alter table public.app_user_profiles enable row level security;
alter table public.employees enable row level security;
alter table public.attendance_absences enable row level security;
alter table public.leave_requests enable row level security;
alter table public.finance_daily_entries enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.establishment_documents enable row level security;
alter table public.attachments enable row level security;

create policy app_profiles_select on public.app_user_profiles
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy app_profiles_admin_write on public.app_user_profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy employees_select on public.employees
for select to authenticated
using (true);

create policy employees_insert on public.employees
for insert to authenticated
with check (public.current_app_role() in ('admin', 'hr'));

create policy employees_update on public.employees
for update to authenticated
using (public.current_app_role() in ('admin', 'hr'))
with check (public.current_app_role() in ('admin', 'hr'));

create policy employees_delete on public.employees
for delete to authenticated
using (public.is_admin());

create policy absences_select on public.attendance_absences
for select to authenticated
using (true);

create policy absences_write on public.attendance_absences
for all to authenticated
using (public.current_app_role() in ('admin', 'hr', 'manager'))
with check (public.current_app_role() in ('admin', 'hr', 'manager'));

create policy leave_requests_select on public.leave_requests
for select to authenticated
using (true);

create policy leave_requests_write on public.leave_requests
for all to authenticated
using (public.current_app_role() in ('admin', 'hr', 'manager'))
with check (public.current_app_role() in ('admin', 'hr', 'manager'));

create policy finance_select on public.finance_daily_entries
for select to authenticated
using (public.current_app_role() in ('admin', 'accountant'));

create policy finance_write on public.finance_daily_entries
for all to authenticated
using (public.current_app_role() in ('admin', 'accountant'))
with check (public.current_app_role() in ('admin', 'accountant'));

create policy payroll_select on public.payroll_runs
for select to authenticated
using (public.current_app_role() in ('admin', 'accountant', 'hr'));

create policy payroll_write on public.payroll_runs
for all to authenticated
using (public.current_app_role() in ('admin', 'accountant'))
with check (public.current_app_role() in ('admin', 'accountant'));

create policy establishment_documents_select on public.establishment_documents
for select to authenticated
using (true);

create policy establishment_documents_write on public.establishment_documents
for all to authenticated
using (public.current_app_role() in ('admin', 'hr'))
with check (public.current_app_role() in ('admin', 'hr'));

create policy attachments_select on public.attachments
for select to authenticated
using (true);

create policy attachments_write on public.attachments
for all to authenticated
using (public.current_app_role() in ('admin', 'hr', 'accountant'))
with check (public.current_app_role() in ('admin', 'hr', 'accountant'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('employee-attachments', 'employee-attachments', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf']),
  ('company-documents', 'company-documents', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf']),
  ('establishment-documents', 'establishment-documents', false, 10485760, array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy storage_private_read on storage.objects
for select to authenticated
using (bucket_id in ('employee-attachments', 'company-documents', 'establishment-documents'));

create policy storage_private_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in ('employee-attachments', 'company-documents', 'establishment-documents')
  and public.current_app_role() in ('admin', 'hr', 'accountant')
);

create policy storage_private_update on storage.objects
for update to authenticated
using (
  bucket_id in ('employee-attachments', 'company-documents', 'establishment-documents')
  and public.current_app_role() in ('admin', 'hr', 'accountant')
)
with check (
  bucket_id in ('employee-attachments', 'company-documents', 'establishment-documents')
  and public.current_app_role() in ('admin', 'hr', 'accountant')
);

create policy storage_private_delete on storage.objects
for delete to authenticated
using (
  bucket_id in ('employee-attachments', 'company-documents', 'establishment-documents')
  and public.is_admin()
);
