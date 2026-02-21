import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signIn } from "@/lib/auth"
import { BarChart3 } from "lucide-react"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            إحصائيات جميع مواقعك في مكان واحد
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              Google Search Console — ظهور وضغطات وترتيب
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              Google Analytics 4 — زوار وجلسات
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-2 h-2 rounded-full bg-sky-400"></div>
              جميع مواقعك في جدول واحد مع الإجماليات
            </div>
          </div>

          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 font-medium rounded-xl px-4 py-3 transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>تسجيل الدخول بـ Google</span>
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
            سيطلب التطبيق صلاحية قراءة بيانات Search Console و Analytics فقط
          </p>
        </div>
      </div>
    </div>
  )
}
