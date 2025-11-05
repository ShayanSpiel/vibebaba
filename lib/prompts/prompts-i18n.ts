/**
 * AI PROMPTS INTERNATIONALIZATION
 *
 * STATUS: DORMANT
 *
 * Multi-language prompt templates for future use.
 * Currently not imported/used anywhere.
 *
 * Will activate when Persian (Farsi) translation is needed.
 * Keep this file unchanged - do not delete.
 *
 * This module provides i18n support for AI prompts.
 * All system prompts can be translated and will adapt to the user's locale.
 */

type Locale = "en" | "fa" | "ar";

interface PromptTranslations {
  en: string;
  fa: string;
  ar: string;
}

/**
 * Get localized prompt template
 */
export function getLocalizedPrompt(
  promptKey: keyof typeof PROMPTS,
  locale: Locale = "en"
): string {
  return PROMPTS[promptKey][locale];
}

/**
 * Build a prompt with dynamic values
 */
export function buildPrompt(
  promptKey: keyof typeof PROMPTS,
  locale: Locale = "en",
  values: Record<string, string> = {}
): string {
  let prompt = getLocalizedPrompt(promptKey, locale);

  // Replace placeholders like {appDescription} with actual values
  Object.entries(values).forEach(([key, value]) => {
    prompt = prompt.replace(new RegExp(`{${key}}`, "g"), value);
  });

  return prompt;
}

/**
 * PROMPT TEMPLATES
 *
 * Each prompt has translations for all supported locales.
 * To add a new language, add its translation to each prompt object.
 */
export const PROMPTS = {
  // ============================================
  // GENERATE PLAN PROMPT
  // ============================================
  generatePlan: {
    en: `You are an expert product manager. Create a concise, actionable plan for this app idea:

"{appDescription}"

Structure your plan using this exact format:

**App Overview**
[2-3 sentences describing what the app does and its value to users]

**Core Features**
• Feature 1: [brief description]
• Feature 2: [brief description]
• Feature 3: [brief description]
[List 4-6 main features total]

**User Journey**
1. [First key action]
2. [Second key action]
3. [Third key action]
[List 3-5 main user flows]

**Data Models**
• [Entity 1]: [key fields]
• [Entity 2]: [key fields]
[List 2-4 main data entities]

**UI/UX Highlights**
• [Design consideration 1]
• [Design consideration 2]
[List 2-3 key design points]

IMPORTANT:
- Keep it concise and scannable
- Use bullet points but NO colored emojis
- Be specific and actionable
- Focus on what users can DO
- Maximum 300 words total

Generate the plan now:`,

    fa: `شما یک مدیر محصول متخصص هستید. یک طرح مختصر و قابل اجرا برای این ایده اپلیکیشن ایجاد کنید:

"{appDescription}"

طرح خود را با استفاده از این قالب دقیق ساختار دهید:

**بررسی کلی اپلیکیشن**
[2-3 جمله توضیح دهنده اینکه اپلیکیشن چه کاری انجام می‌دهد و چه ارزشی برای کاربران دارد]

**ویژگی‌های اصلی**
• ویژگی 1: [توضیح مختصر]
• ویژگی 2: [توضیح مختصر]
• ویژگی 3: [توضیح مختصر]
[در مجموع 4-6 ویژگی اصلی لیست کنید]

**سفر کاربر**
1. [اولین اقدام کلیدی]
2. [دومین اقدام کلیدی]
3. [سومین اقدام کلیدی]
[3-5 جریان اصلی کاربر را لیست کنید]

**مدل‌های داده**
• [موجودیت 1]: [فیلدهای کلیدی]
• [موجودیت 2]: [فیلدهای کلیدی]
[2-4 موجودیت داده اصلی را لیست کنید]

**نکات برجسته UI/UX**
• [ملاحظه طراحی 1]
• [ملاحظه طراحی 2]
[2-3 نکته کلیدی طراحی را لیست کنید]

مهم:
- مختصر و قابل اسکن نگه دارید
- از نقطه‌ها استفاده کنید اما بدون ایموجی رنگی
- مشخص و قابل اجرا باشید
- بر آنچه کاربران می‌توانند انجام دهند تمرکز کنید
- حداکثر 300 کلمه

اکنون طرح را تولید کنید:`,

    ar: `أنت مدير منتج خبير. أنشئ خطة موجزة وقابلة للتنفيذ لفكرة التطبيق هذه:

"{appDescription}"

قم بهيكلة خطتك باستخدام هذا التنسيق بالضبط:

**نظرة عامة على التطبيق**
[2-3 جمل تصف ما يفعله التطبيق وقيمته للمستخدمين]

**الميزات الأساسية**
• الميزة 1: [وصف موجز]
• الميزة 2: [وصف موجز]
• الميزة 3: [وصف موجز]
[اذكر 4-6 ميزات رئيسية في المجموع]

**رحلة المستخدم**
1. [الإجراء الرئيسي الأول]
2. [الإجراء الرئيسي الثاني]
3. [الإجراء الرئيسي الثالث]
[اذكر 3-5 تدفقات مستخدم رئيسية]

**نماذج البيانات**
• [الكيان 1]: [الحقول الرئيسية]
• [الكيان 2]: [الحقول الرئيسية]
[اذكر 2-4 كيانات بيانات رئيسية]

**أبرز UI/UX**
• [اعتبار التصميم 1]
• [اعتبار التصميم 2]
[اذكر 2-3 نقاط تصميم رئيسية]

مهم:
- اجعلها موجزة وقابلة للمسح
- استخدم النقاط النقطية ولكن بدون رموز تعبيرية ملونة
- كن محددًا وقابلاً للتنفيذ
- ركز على ما يمكن للمستخدمين القيام به
- بحد أقصى 300 كلمة في المجموع

أنشئ الخطة الآن:`,
  },

  // ============================================
  // GENERATE PROTOTYPE PROMPT
  // ============================================
  generatePrototype: {
    en: `You are an expert frontend developer. Create a complete, production-ready prototype based on this plan:

{plan}

Requirements:
- Use React with TypeScript OR vanilla HTML/CSS/JavaScript (choose based on complexity)
- Use Tailwind CSS for styling
- Create functional, interactive components
- Include proper error handling
- Follow best practices and accessibility standards
- Make it responsive and mobile-friendly

⚠️ CRITICAL: Complete routing and file structure instructions will be provided separately.
⚠️ CRITICAL: ALWAYS provide COMPLETE file contents - NO placeholders or "rest of code" comments!
⚠️ CRITICAL: All database methods are async - always use "await" before window.db.get/add/update/delete!

OUTPUT FORMAT:
- Single HTML app: Return complete HTML starting with <!DOCTYPE html>
- Multi-file app: Return JSON array: [{"path": "index.html", "content": "<!DOCTYPE..."}, ...]
- Each file must be COMPLETE and ready to run!

Generate the complete code now:`,

    fa: `شما یک توسعه‌دهنده فرانت‌اند متخصص هستید. یک نمونه اولیه کامل و آماده تولید بر اساس این طرح ایجاد کنید:

{plan}

الزامات:
- از React با TypeScript استفاده کنید
- از Tailwind CSS برای استایل‌دهی استفاده کنید
- کامپوننت‌های کاربردی و تعاملی ایجاد کنید
- مدیریت خطای مناسب را شامل شوید
- بهترین روش‌ها و استانداردهای دسترسی‌پذیری را رعایت کنید
- آن را واکنش‌گرا و موبایل‌پسند کنید

اکنون کد کامل را تولید کنید:`,

    ar: `أنت مطور واجهة أمامية خبير. أنشئ نموذجًا أوليًا كاملاً وجاهزًا للإنتاج بناءً على هذه الخطة:

{plan}

المتطلبات:
- استخدم React مع TypeScript
- استخدم Tailwind CSS للتصميم
- أنشئ مكونات وظيفية وتفاعلية
- قم بتضمين معالجة الأخطاء المناسبة
- اتبع أفضل الممارسات ومعايير إمكانية الوصول
- اجعله متجاوبًا ومتوافقًا مع الأجهزة المحمولة

أنشئ الكود الكامل الآن:`,
  },

  // ============================================
  // REFINE PLAN PROMPT (Chat)
  // ============================================
  refinePlan: {
    en: `You are an expert product manager helping refine an app plan.

Current plan:
{currentPlan}

User request:
{userMessage}

Please update the plan based on the user's feedback. Keep the same structure and format.`,

    fa: `شما یک مدیر محصول متخصص هستید که در بهبود طرح اپلیکیشن کمک می‌کنید.

طرح فعلی:
{currentPlan}

درخواست کاربر:
{userMessage}

لطفاً طرح را بر اساس بازخورد کاربر به‌روزرسانی کنید. همان ساختار و قالب را حفظ کنید.`,

    ar: `أنت مدير منتج خبير يساعد في تحسين خطة التطبيق.

الخطة الحالية:
{currentPlan}

طلب المستخدم:
{userMessage}

يرجى تحديث الخطة بناءً على ملاحظات المستخدم. احتفظ بنفس الهيكل والتنسيق.`,
  },

  // ============================================
  // GENERATE BACKEND PROMPT
  // ============================================
  generateBackend: {
    en: `You are an expert backend developer. Create a complete backend implementation for this app:

Plan:
{plan}

Frontend Code:
{frontendCode}

Requirements:
- Use Node.js/Express or Next.js API routes
- Implement proper authentication
- Create database schema and models
- Add API endpoints with validation
- Include error handling and security best practices
- Use TypeScript

Generate the complete backend code now:`,

    fa: `شما یک توسعه‌دهنده بک‌اند متخصص هستید. یک پیاده‌سازی کامل بک‌اند برای این اپلیکیشن ایجاد کنید:

طرح:
{plan}

کد فرانت‌اند:
{frontendCode}

الزامات:
- از Node.js/Express یا مسیرهای API Next.js استفاده کنید
- احراز هویت مناسب را پیاده‌سازی کنید
- طرح و مدل‌های دیتابیس ایجاد کنید
- نقاط پایانی API با اعتبارسنجی اضافه کنید
- مدیریت خطا و بهترین روش‌های امنیتی را شامل شوید
- از TypeScript استفاده کنید

اکنون کد کامل بک‌اند را تولید کنید:`,

    ar: `أنت مطور خلفي خبير. أنشئ تنفيذًا خلفيًا كاملاً لهذا التطبيق:

الخطة:
{plan}

كود الواجهة الأمامية:
{frontendCode}

المتطلبات:
- استخدم Node.js/Express أو مسارات API Next.js
- قم بتنفيذ المصادقة المناسبة
- أنشئ مخطط قاعدة البيانات والنماذج
- أضف نقاط نهاية API مع التحقق من الصحة
- قم بتضمين معالجة الأخطاء وأفضل ممارسات الأمان
- استخدم TypeScript

أنشئ كود الخلفية الكامل الآن:`,
  },
} as const;

/**
 * Helper function to get locale from request or context
 */
export function getLocaleFromHeaders(headers: Headers): Locale {
  const locale = headers.get("x-locale") || headers.get("accept-language")?.split(",")[0]?.split("-")[0];

  if (locale === "fa" || locale === "ar") {
    return locale;
  }

  return "en";
}
