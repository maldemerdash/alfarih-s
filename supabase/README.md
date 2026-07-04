# Supabase setup

1. أنشئ مشروع Supabase جديد.
2. شغل ملف `migrations/0001_initial_schema.sql` من SQL Editor، أو استخدم Supabase CLI.
3. أنشئ أول مستخدم من Authentication.
4. انسخ `user_id` للمستخدم وشغل `seed_admin_template.sql` بعد تعديل القيم.
5. أضف متغيرات Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Buckets الخاصة بالمرفقات:

- `employee-attachments`
- `company-documents`
- `establishment-documents`

كل Bucket خاص وليس عامًا. القراءة والرفع تتم عبر جلسة مستخدم مصرح.
