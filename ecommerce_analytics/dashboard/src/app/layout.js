import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Ecommerce Analytics Platform",
  description: "Analytics dashboard with ML predictions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[var(--surface-0)] text-[var(--text-1)] antialiased`}
      >
        {/* Global background system */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-violet-900/10 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-500/10 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[140px] rounded-full" />
        </div>

        {/* App shell */}
        <div className="min-h-screen flex flex-col">

          {/* Top status bar */}
          <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
            <div className="max-w-[1440px] mx-auto px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/60">
                  Analytics Engine • Live System
                </span>
              </div>
              <div className="text-xs text-white/40">
                dbt • FastAPI • XGBoost • BigQuery
              </div>
            </div>
          </header>

          {/* Page container */}
          <main className="flex-1">
            <div className="max-w-[1440px] mx-auto px-6 py-8">
              {children}
            </div>
          </main>

        </div>
      </body>
    </html>
  );
}