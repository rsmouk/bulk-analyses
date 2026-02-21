# Analytics Dashboard

لوحة تحكم تجمع إحصائيات جميع مواقعك من **Google Search Console** و **Google Analytics 4** في مكان واحد.

## المميزات

- **إجماليات** فورية: ظهور، ضغطات، زوار، CTR
- **جدول** قابل للفرز لجميع المواقع
- **تصفية** المواقع وتحديد الفترة الزمنية
- **ربط GA4 Property ID** لكل موقع
- نشر على **Vercel** + قاعدة بيانات **Supabase**

---

## خطوات الإعداد

### 1. Google Cloud Console

1. افتح [console.cloud.google.com](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل هذه APIs:
   - **Google Search Console API**
   - **Google Analytics Data API**
4. انتقل إلى **APIs & Services > Credentials**
5. أنشئ **OAuth 2.0 Client ID** من نوع **Web Application**
6. أضف Redirect URI:
   - للتطوير: `http://localhost:3000/api/auth/callback/google`
   - للإنتاج: `https://your-app.vercel.app/api/auth/callback/google`
7. انسخ **Client ID** و **Client Secret**

### 2. Supabase

1. افتح [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. انتقل إلى **SQL Editor**
3. انسخ محتوى ملف `supabase-schema.sql` وشغّله
4. انتقل إلى **Project Settings > API** وانسخ:
   - `Project URL`
   - `anon public` key
   - `service_role` key

### 3. إعداد المشروع محلياً

```bash
# انسخ ملف البيئة
cp .env.example .env.local

# افتح .env.local وأضف قيمك الحقيقية
```

أنشئ AUTH_SECRET عشوائياً:
```bash
openssl rand -base64 32
```

### 4. تشغيل محلياً

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

---

## النشر على Vercel

1. ارفع المشروع على GitHub
2. افتح [vercel.com](https://vercel.com) واربطه بالـ repo
3. أضف **Environment Variables** في Vercel Dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. انشر!

---

## كيفية استخدام لوحة التحكم

1. **سجّل الدخول** بحساب Google المرتبط بـ Search Console
2. ستظهر **جميع مواقعك تلقائياً** من Search Console
3. لعرض **بيانات الزوار** من GA4:
   - في الـ Sidebar، اضغط على "ربط GA4 Property ID" بجانب كل موقع
   - أدخل **Property ID** (أرقام فقط، مثال: `123456789`)
   - يمكنك إيجاده في: GA4 > Admin > Property Settings
4. اختر **الفترة الزمنية** من القائمة المنسدلة
5. يمكنك **إخفاء مواقع** معينة بإلغاء تفعيل الـ Checkbox
