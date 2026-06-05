'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MonitorPlay, BellRing, Clock, PhoneCall } from 'lucide-react';

export default function TVScreen() {
  const [activeClinics, setActiveClinics] = useState<any[]>([]);
  const [lastCalled, setLastCalled] = useState<any | null>(null);
  const [settings, setSettings] = useState<any>({ news_ticker: '', clinic_name: 'مجمع العيادات', phones: '' });
  const [isScreenActive, setIsScreenActive] = useState(false);

  // دالة التشغيل التتابعي للملفات الصوتية
  const playAudioSequence = async (urls: string[]) => {
    for (const url of urls) {
      await new Promise((resolve) => {
        const audio = new Audio(url);
        audio.onended = resolve; // عند انتهاء الملف، انتقل للتالي
        audio.onerror = resolve; // إذا لم يجد الملف (مثلا رقم 51)، تخطاه للتالي
        audio.play().catch(resolve); // لتجاوز مشكلة حظر المتصفح للتشغيل التلقائي
      });
    }
  };

  const fetchCurrentState = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: clinicsData } = await supabase.from('clinics').select('*');
    if (clinicsData) {
      const { data: queuesData } = await supabase.from('queues').select('*, patients(name)').eq('status', 'in_clinic').gte('created_at', today.toISOString());
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

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*');
    if (data) {
      const sObj: any = {};
      data.forEach(s => sObj[s.setting_key] = s.setting_value);
      setSettings(sObj);
    }
  };

  useEffect(() => {
    fetchCurrentState();
    fetchSettings();

    // 1. الاستماع للطوابير والنداء الآلي
    const queueChannel = supabase.channel('queue-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'queues', filter: "status=eq.in_clinic" }, async (payload) => {
        // نطلب اسم العيادة ورقم الغرفة (room_number) لتشغيل الصوت الصحيح
        const { data } = await supabase.from('queues').select('*, clinics(name, room_number)').eq('id', payload.new.id).single();
        
        if (data) {
          setLastCalled(data); 
          fetchCurrentState();
          
          // بناء قائمة التشغيل
          const sequenceUrls = ['/ding.mp3']; // 1. صوت التنبيه
          
          // 2. ملف رقم العميل (نفترض أن لديك ملفات من 1 إلى 50)
          if (data.ticket_number <= 50) {
            sequenceUrls.push(`/${data.ticket_number}.mp3`);
          }

          // 3. ملف رقم العيادة (بالاعتماد على حقل room_number)
          if (data.clinics?.room_number) {
            sequenceUrls.push(`/clinic${data.clinics.room_number}.mp3`);
          }

          // تشغيل القائمة بالترتيب
          playAudioSequence(sequenceUrls);

          // إخفاء التنبيه المرئي من الشاشة بعد 15 ثانية (لإعطاء وقت كافٍ للصوت)
          setTimeout(() => setLastCalled(null), 15000);
        }
      }).subscribe();

    // 2. الاستماع للأحداث الصوتية اللحظية المخصصة من المدير
    const eventsChannel = supabase.channel('screen-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'screen_events' }, (payload: any) => {
        if (payload.new.event_type === 'PLAY_AUDIO') {
          playAudioSequence([payload.new.payload.url]);
        }
      }).subscribe();

    // 3. الاستماع لتحديثات شريط الأخبار اللحظية
    const settingsChannel = supabase.channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      }).subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  if (!isScreenActive) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <MonitorPlay size={80} className="text-teal-500 mb-6 animate-bounce" />
      <button onClick={() => setIsScreenActive(true)} className="bg-teal-600 text-white text-2xl font-bold py-4 px-12 rounded-full shadow-[0_0_30px_rgba(13,148,136,0.5)] transition-all">بدء تشغيل الشاشة والنداء الآلي</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col fixed inset-0 z-50">
      {/* الشريط العلوي */}
      <header className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700 shadow-xl">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-teal-400 to-blue-500">
            {settings.clinic_name}
          </h1>
        </div>
        <div className="flex items-center gap-6">
          {settings.phones && (
            <div className="flex items-center gap-2 text-amber-400 text-xl font-bold bg-slate-700 px-4 py-2 rounded-full">
              <PhoneCall size={20} /> {settings.phones}
            </div>
          )}
          <div className="flex items-center gap-3 text-2xl font-bold text-slate-300">
            <Clock className="text-teal-400" size={32} />
            {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* تنبيه النداء */}
      {lastCalled && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-11/12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl shadow-[0_0_100px_rgba(245,158,11,0.6)] p-8 text-center z-50 animate-in zoom-in duration-300">
          <BellRing size={64} className="text-white animate-bounce mx-auto mb-4" />
          <h2 className="text-5xl font-black text-white mb-6">نداء جديد</h2>
          <div className="text-8xl font-black text-white mb-4 drop-shadow-2xl">تذكرة: {lastCalled.ticket_number}</div>
          <p className="text-5xl font-bold text-amber-100">التوجه إلى: {lastCalled.clinics?.name}</p>
        </div>
      )}

      {/* شبكة العيادات */}
      <main className="flex-1 p-8 overflow-hidden flex items-center justify-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full max-w-[1800px]">
          {activeClinics.map((clinic) => (
            <div key={clinic.id} className={`rounded-3xl border-4 overflow-hidden transform transition-all duration-500 ${
              lastCalled?.clinic_id === clinic.id 
                ? 'border-amber-400 scale-105 shadow-[0_0_50px_rgba(251,191,36,0.3)]' 
                : 'border-slate-700 bg-slate-800'
            }`}>
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

      {/* الشريط الإخباري */}
      <footer className="bg-teal-900 text-teal-100 py-4 overflow-hidden whitespace-nowrap border-t border-teal-700">
        <div className="animate-[marquee_25s_linear_infinite] inline-block text-3xl font-bold">
          {settings.news_ticker || 'مرحباً بكم...'}
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}} />
    </div>
  );
}
