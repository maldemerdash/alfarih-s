# الفريح - نظام الموظفين والمبيعات

نسخة v2 مستقلة مبنية للنشر على Vercel والربط مع Supabase جديد.

## التقنية

- React + Vite
- Supabase Auth
- Supabase Database
- Supabase Storage للمرفقات
- Vercel للنشر

## التشغيل المحلي

```bash
npm install
npm run dev
```

أنشئ ملف `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## النشر على Vercel

المشروع جاهز لـ Vercel من GitHub. بعد ربط المستودع، أضف Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

ثم أعد نشر المشروع.

## إعداد Supabase

شغل SQL التالي في Supabase SQL Editor:

```text
supabase/migrations/0001_initial_schema.sql
```

بعدها:

1. أنشئ أول مستخدم من Supabase Authentication.
2. انسخ `user_id`.
3. عدل وشغل:

```text
supabase/seed_admin_template.sql
```

## المرفقات

المرفقات لا تحفظ في GitHub ولا Vercel. تحفظ في Supabase Storage داخل Buckets خاصة:

- `employee-attachments`
- `company-documents`
- `establishment-documents`

## الصفحات الحالية

- تسجيل الدخول
- الصفحة الرئيسية
- الموظفون
- الحضور والانصراف
- الإجازات والسفر
- المالية
- الرواتب
- التقارير
- وثائق المنشأة
- إدارة المستخدمين
- الإعدادات

تم تجهيز CRUD مبدئي للموظفين ووثائق المنشأة، وبقية الصفحات موضوعة كأساس قابل للتوسعة.
