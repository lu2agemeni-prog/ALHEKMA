import Link from 'next/link';
import { LayoutDashboard, Stethoscope, UserCheck, MonitorPlay } from 'lucide-react';

export default function HomePage() {
  const sections = [
    {
      title: 'لوحة التحكم للمدير',
      desc: 'إدارة الجداول، الحسابات، العمالة، المخزن، والنسخ الاحتياطي.',
      icon: <LayoutDashboard className="w-12 h-12 text-primary" />,
      href: '/admin',
      color: 'hover:border-primary'
    },
    {
      title: 'بوابة الأطباء',
      desc: 'دخول الطبيب لعيادته الخاصة ومتابعة طابور المرضى والكشف المباشر.',
      icon: <Stethoscope className="w-12 h-12 text-teal-600" />,
      href: '/doctor',
      color: 'hover:border-teal-600'
    },
    {
      title: 'مكتب الاستقبال والتسجيل',
      desc: 'استقبال المرضى، فتح ملفات جديدة، وقطع أرقام وتذاكر الطابور.',
      icon: <UserCheck className="w-12 h-12 text-blue-600" />,
      href: '/reception',
      color: 'hover:border-blue-600'
    },
    {
      title: 'شاشة العرض (32 بوصة)',
      desc: 'العرض اللحظي المباشر لطوابير العيادات في صالة الانتظار.',
      icon: <MonitorPlay className="w-12 h-12 text-amber-600" />,
      href: '/screen',
      color: 'hover:border-amber-600'
    }
  ];

  return (
    <div className="py-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-3">مرحباً بك في نظام الإدارة الذكي</h2>
        <p className="text-slate-600">الرجاء اختيار الواجهة المخصصة للعمل للبدء في إدارة العمليات اليومية للمجمع.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {sections.map((sec, idx) => (
          <Link 
            key={idx} 
            href={sec.href}
            className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start gap-4 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md ${sec.color}`}
          >
            <div className="p-3 bg-slate-50 rounded-lg">
              {sec.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">{sec.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{sec.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
