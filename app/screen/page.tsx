'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MonitorPlay, BellRing, Clock } from 'lucide-react';

export default function TVScreen() {
  const [activeClinics, setActiveClinics] = useState<any[]>([]);
  const [lastCalled, setLastCalled] = useState<any | null>(null);
  
  // المتصفحات تمنع تشغيل الصوت تلقائياً إلا بعد تفاعل المستخدم
  // لذا سنضع زراً للبدء لتفعيل الشاشة والصوت
  const [isScreenActive, setIsScreenActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // دالة لجلب الحالة الحالية للعيادات
  const fetchCurrentState = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // نجلب كل العيادات مع المريض الموجود "داخل العيادة" حالياً
    const { data: clinicsData } = await supabase.from('clinics').select('*');
    
    if (clinicsData) {
      const { data: queuesData } = await supabase
        .from('queues')
        .select('*, patients(name)')
        .eq('status', 'in_clinic')
        .gte('created_at', today.toISOString());

      // دمج البيانات: كل عيادة مع رقم المريض الحالي إن وجد
      const combined = clinicsData.map(clinic => {
        const currentPatient = queuesData?.find(q => q.clinic_id === clinic.id);
        return {
          ...clinic,
          currentTicket: currentPatient ? currentPatient.ticket_number : '---',
          patientName: currentPatient ? currentPatient.patients?.name : ''
        };
      });

      setActiveClinics(combined);
    }
  };

  useEffect(() => {
    fetchCurrentState();

    // === تفعيل تقنية Realtime ===
    // الاستماع لأي تغيير في جدول الطوابير
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queues',
          filter: "status=eq.in_clinic" // نستمع فقط عندما تتغير الحالة لـ "داخل العيادة"
        },
        async (payload) => {
          // جلب بيانات المريض والعيادة للتحديث اللحظي
          const { data: fullData } = await supabase
            .from('queues')
            .select('*, clinics(name)')
            .eq('id', payload.new.id)
            .single();

          if (fullData) {
            setLastCalled(fullData);
            fetchCurrentState(); // تحديث باقي الشاشة
            
            // تشغيل صوت التنبيه
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }

            // إخفاء التنبيه الكبير بعد 10 ثواني
            setTimeout(() => {
              setLastCalled(null);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // شاشة التفعيل المبدئية (للسماح بتشغيل الصوت)
  if (!isScreenActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <MonitorPlay size={80} className="text-teal-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-bold mb-8">شاشة عرض الطوابير</h1>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          اضغط على الزر أدناه لتفعيل الشاشة بوضع ملء الشاشة والسماح بتشغيل أصوات التنبيه التلقائية.
        </p>
        <button 
          onClick={() => setIsScreenActive(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(13,148,136,0.5)] transition-all"
        >
          بدء تشغيل الشاشة
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col fixed inset-0 z-50">
      {/* ملف الصوت (يجب وضع ملف بصيغة mp3 باسم bell.mp3 في مجلد public) */}
      <audio ref={audioRef} src="/bell.mp3" preload="auto" />

      {/* الشريط العلوي */}
      <header className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700 shadow-xl">
        <div className="flex items-center gap-4">
          <MonitorPlay className="w-12 h-12 text-teal-400" />
          <h1 className="text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-blue-500">
            مجمع عيادات الحكمة
          </h1>
        </div>
        <div className="flex items-center gap-3 text-2xl font-bold text-slate-300">
          <Clock className="text-teal-400" size={32} />
          {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </header>

      {/* منطقة التنبيه اللحظي (تظهر فقط عند استدعاء مريض جديد) */}
      {lastCalled && (
        <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-11/12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-[0_0_100px_rgba(245,158,11,0.6)] p-8 text-center z-50 animate-in zoom-in duration-300">
          <div className="flex justify-center mb-4">
            <BellRing size={64} className="text-white animate-bounce" />
          </div>
          <h2 className="text-5xl font-black text-white mb-6">نداء جديد</h2>
          <div className="text-8xl font-black text-white drop-shadow-2xl mb-4">
            تذكرة رقم: {lastCalled.ticket_number}
          </div>
          <p className="text-5xl font-bold text-amber-100">
            التوجه فوراً إلى عيادة: {lastCalled.clinics?.name}
          </p>
        </div>
      )}

      {/* شبكة العيادات (تعرض الأرقام الحالية) */}
      <main className="flex-1 p-8 overflow-hidden flex items-center justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-[1800px]">
          {activeClinics.map((clinic) => (
            <div 
              key={clinic.id} 
              className={`rounded-3xl border-4 overflow-hidden transform transition-all duration-500 ${
                lastCalled?.clinic_id === clinic.id 
                  ? 'border-amber-400 scale-105 shadow-[0_0_50px_rgba(251,191,36,0.3)]' 
                  : 'border-slate-700 bg-slate-800'
              }`}
            >
              <div className={`p-6 text-center border-b-4 ${
                lastCalled?.clinic_id === clinic.id ? 'bg-amber-500 border-amber-600' : 'bg-slate-700 border-slate-600'
              }`}>
                <h3 className={`text-4xl font-black ${
                  lastCalled?.clinic_id === clinic.id ? 'text-slate-900' : 'text-slate-200'
                }`}>
                  {clinic.name}
                </h3>
              </div>
              
              <div className="p-10 flex flex-col items-center justify-center bg-slate-800/50 min-h-[250px]">
                <span className="text-2xl text-slate-400 font-bold mb-4">الرقم الحالي</span>
                <span className={`text-9xl font-black tracking-tighter ${
                  clinic.currentTicket === '---' ? 'text-slate-600' : 'text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]'
                }`}>
                  {clinic.currentTicket}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* الشريط السفلي المتحرك (اختياري للإعلانات أو التنبيهات) */}
      <footer className="bg-teal-900 text-teal-100 py-3 overflow-hidden whitespace-nowrap border-t border-teal-700">
        <div className="animate-[marquee_20s_linear_infinite] inline-block text-2xl font-bold">
          نرجو من السادة المراجعين الالتزام بالهدوء والانتظار حتى ظهور الرقم على الشاشة... نتمنى لكم دوام الصحة والعافية.
        </div>
      </footer>
      
      {/* CSS مخصص لحركة الشريط السفلي */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </div>
  );
}
