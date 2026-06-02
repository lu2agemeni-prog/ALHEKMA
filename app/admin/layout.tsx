import Link from 'next/link';
import { LayoutDashboard, Stethoscope, Users, Wallet, Box, Settings } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'الرئيسية', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { name: 'العيادات', icon: <Stethoscope size={20} />, href: '/admin/clinics' },
    { name: 'الطاقم الطبي', icon: <Users size={20} />, href: '/admin/staff' },
    { name: 'المالية والحسابات', icon: <Wallet size={20} />, href: '/admin/finances' },
    { name: 'المخزن الطبي', icon: <Box size={20} />, href: '/admin/inventory' },
    { name: 'الإعدادات', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* القائمة الجانبية */}
      <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit">
        <div className="mb-6 pb-4 border-b border-slate-100 text-center">
          <h2 className="text-lg font-bold text-slate-800">إدارة المجمع</h2>
          <p className="text-xs text-slate-500">حساب المدير العام</p>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* محتوى الصفحة المتغير */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
