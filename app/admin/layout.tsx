'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { LayoutDashboard, Stethoscope, Users, Wallet, Box, Settings, LogOut, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: staff } = await supabase
        .from('staff')
        .select('role, name')
        .eq('email', session.user.email)
        .single();

      if (staff?.role !== 'admin') {
        router.push('/login');
        return;
      }

      setUserName(staff.name);
      setIsAuthorized(true);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push('/login');
  };

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center text-primary font-bold text-xl">جاري التحقق من الصلاحيات والبيانات...</div>;
  }

  const menuItems = [
    { name: 'بوابة النظام', icon: <Home size={20} />, href: '/' },
    { name: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { name: 'العيادات', icon: <Stethoscope size={20} />, href: '/admin/clinics' },
    { name: 'الطاقم الطبي', icon: <Users size={20} />, href: '/admin/staff' },
    { name: 'المالية والحسابات', icon: <Wallet size={20} />, href: '/admin/finances' },
    { name: 'المخزن الطبي', icon: <Box size={20} />, href: '/admin/inventory' },
    { name: 'الإعدادات', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-fit flex flex-col min-h-[80vh]">
        <div className="mb-6 pb-4 border-b border-slate-100 text-center">
          <h2 className="text-lg font-bold text-slate-800">إدارة المجمع</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">مرحباً: {userName}</p>
        </div>
        <nav className="space-y-2 flex-1">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} className="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-colors">
              {item.icon} <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 py-2 rounded-lg font-bold transition-colors">
            <LogOut size={18} /> تسجيل خروج
          </button>
        </div>
      </aside>
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
