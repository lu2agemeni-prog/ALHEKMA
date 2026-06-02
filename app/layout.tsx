import './globals.css';

export const metadata = {
  title: 'نظام عيادات الحكمة المتكامل',
  description: 'إدارة العيادات والطوابير الطبية بشكل لحظي',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen flex flex-col">
        {/* شريط علوي بسيط وثابت لكل الصفحات */}
        <header className="bg-primary text-white shadow-md py-4 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-wide">مجمع عيادات الحكمة الطبي</h1>
            <div className="bg-teal-800 text-xs px-3 py-1 rounded-full animate-pulse">
              النظام متصل بالشبكة اللحظية
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>

        <footer className="bg-slate-800 text-slate-400 text-center py-3 text-sm mt-auto">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - نظام عيادات الحكمة
        </footer>
      </body>
    </html>
  );
}
