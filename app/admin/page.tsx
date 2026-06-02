import { Activity, Users, Clock, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { title: 'المرضى اليوم', value: '45', icon: <Users className="text-blue-500" /> },
    { title: 'في الانتظار', value: '12', icon: <Clock className="text-amber-500" /> },
    { title: 'العيادات النشطة', value: '8', icon: <Activity className="text-teal-500" /> },
    { title: 'دخل اليوم', value: '2,450 ج', icon: <TrendingUp className="text-green-500" /> },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">نظرة عامة على النظام</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
            <div className="p-3 bg-white rounded-full shadow-sm">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
        مرحباً بك في لوحة التحكم. الأرقام أعلاه تجريبية حالياً، سيتم ربطها بقاعدة البيانات لاحقاً لعرض الإحصائيات الحقيقية. يمكنك البدء بإضافة العيادات من القائمة الجانبية.
      </div>
    </div>
  );
}
