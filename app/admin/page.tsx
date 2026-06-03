'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, Users, Clock, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    patientsToday: 0,
    waitingToday: 0,
    activeClinics: 0,
    todayIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      
      // تحديد بداية اليوم لجلب إحصائيات اليوم فقط
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      try {
        // 1. المرضى اليوم (عدد تذاكر الطابور المقطوعة اليوم)
        const { count: patientsCount } = await supabase
          .from('queues')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayISO);

        // 2. في الانتظار (حالات اليوم التي ما زالت waiting)
        const { count: waitingCount } = await supabase
          .from('queues')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'waiting')
          .gte('created_at', todayISO);

        // 3. العيادات النشطة (إجمالي العيادات المسجلة)
        const { count: clinicsCount } = await supabase
          .from('clinics')
          .select('*', { count: 'exact', head: true });

        // 4. دخل اليوم (مجموع الإيرادات المسجلة اليوم)
        const { data: incomeData } = await supabase
          .from('finances')
          .select('amount')
          .eq('transaction_type', 'income')
          .gte('created_at', todayISO);

        const totalIncome = incomeData 
          ? incomeData.reduce((sum, record) => sum + Number(record.amount), 0) 
          : 0;

        setStats({
          patientsToday: patientsCount || 0,
          waitingToday: waitingCount || 0,
          activeClinics: clinicsCount || 0,
          todayIncome: totalIncome,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    { title: 'المرضى اليوم', value: stats.patientsToday.toString(), icon: <Users className="text-blue-500" /> },
    { title: 'في الانتظار', value: stats.waitingToday.toString(), icon: <Clock className="text-amber-500" /> },
    { title: 'إجمالي العيادات', value: stats.activeClinics.toString(), icon: <Activity className="text-teal-500" /> },
    { title: 'دخل اليوم', value: `${stats.todayIncome} ج.م`, icon: <TrendingUp className="text-green-500" /> },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">نظرة عامة على النظام</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm text-slate-500 mb-1 font-medium">{stat.title}</p>
              <p className="text-3xl font-black text-slate-800">
                {loading ? <span className="text-slate-300 animate-pulse">...</span> : stat.value}
              </p>
            </div>
            <div className="p-3 bg-white rounded-full shadow-sm">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm leading-relaxed">
        <strong>مرحباً بك في لوحة تحكم عيادات الحكمة.</strong> الأرقام المعروضة أعلاه هي إحصائيات حقيقية ومحدثة مباشرة من قاعدة البيانات. يمكنك متابعة حركة المرضى والدخل اليومي للمركز من هذه الشاشة لحظة بلحظة.
      </div>
    </div>
  );
}
