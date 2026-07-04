-- بعد إنشاء أول مستخدم من Supabase Authentication، استبدل القيم التالية وشغل الأمر.
-- لا تضع هذا الملف في بيئة إنتاج بقيم حقيقية.

insert into public.app_user_profiles (user_id, full_name, email, role, is_active, permissions)
values (
  'AUTH_USER_UUID_HERE',
  'مدير النظام',
  'admin@example.com',
  'admin',
  true,
  '{"all": true}'::jsonb
)
on conflict (email) do update
set user_id = excluded.user_id,
    role = 'admin',
    is_active = true,
    permissions = excluded.permissions,
    updated_at = now();
