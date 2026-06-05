'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Stethoscope, Users, CheckCircle, ArrowRight, Activity, FileText, Volume2, Search } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPortal() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // بيانات الطابور والمريض الحالي
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [currentPatient, setCurrentPatient] = useState<any | null>(null);
  const [customTicket, setCustomTicket] = useState(''); // حقل رقم التذكرة المخصص
  
  // المدخلات الطبية
  const [diagnosis, setDiagnosis] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      const { data } = await supabase.from('clinics').select('*');
      if (data) setClinics(data);
    };
    fetchClinics();
  }, []);

  const fetchQueue = async (clinicId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('queues')
      .select('*, patients(*), visits(*)')
      .eq('clinic_id', clinicId)
      .gte('created_at', today.toISOString())
      .in('status', ['waiting', 'in_clinic'])
      .order('ticket_number', { ascending: true });

    if (!error && data) {
      const inClinic = data.find(q => q.status === 'in_clinic');
      const waiting = data.filter(q => q.status === 'waiting');
      
      setCurrentPatient(inClinic || null);
      setWaitingQueue(waiting);
      
      if (inClinic?.visits) {
        setDiagnosis(inClinic.visits.diagnosis || '');
        setMedicalNotes(inClinic.visits.medical_notes || '');
      } else {
        setDiagnosis('');
        setMedicalNotes('');
      }
    }
  };

  useEffect(() => {
    if (selectedClinic) fetchQueue(selectedClinic);
    else { setWaitingQueue([]); setCurrentPatient(null); }
  }, [selectedClinic]);

  // 1. استدعاء مريض من قائمة الانتظار
  const handleCallNext = async (queueId: string) => {
    if (currentPatient) return alert('يرجى إنهاء كشف المريض الحالي أولاً');
    setLoading(true);
    const { error } = await supabase.from('queues').update({ status: 'in_clinic' }).eq('id', queueId);
    if (!error) fetchQueue(selectedClinic);
    setLoading(false);
  };

  // 2. تكرار النداء للمريض الحالي
  const handleRepeatCall = async () => {
    if (!currentPatient) return;
    setLoading(true);
    // خدعة لتشغيل الـ Realtime: تحويل الحالة لانتظار ثم إعادتها للعيادة فوراً
    await supabase.from('queues').update({ status: 'waiting' }).eq('id', currentPatient.id);
    await supabase.from('queues').update({ status: 'in_clinic' }).eq('id', currentPatient.id);
    alert('تم تكرار النداء على الشاشة');
    setLoading(false);
  };

  // 3. استدعاء مريض برقم تذكرة معين (سواء كان في الانتظار أو تم كشفه سابقاً)
  const handleCallCustomTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTicket) return;
    if (currentPatient) return alert('يرجى إنهاء كشف المريض الحالي أولاً');
    
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // البحث عن التذكرة لليوم الحالي وفي نفس العيادة
    const { data } = await supabase
      .from('queues')
      .select('*')
      .eq('clinic_id', selectedClinic)
      .eq('ticket_number', parseInt(customTicket))
      .gte('created_at', today.toISOString())
      .limit(1);

    if (data && data.length > 0) {
      await supabase.from('queues').update({ status: 'in_clinic' }).eq('id', data[0].id);
      setCustomTicket('');
      fetchQueue(selectedClinic);
    } else {
      alert('لم يتم العثور على مريض بهذا الرقم لليوم الحالي.');
    }
    setLoading(false);
  };

  const handleFinishVisit = async () => {
    if (!currentPatient) return;
    setLoading(true);
    const { error: visitError } = await supabase.from('visits').update({ diagnosis: diagnosis, medical_notes: medicalNotes }).eq('id', currentPatient.visit_id);
    const { error: queueError } = await supabase.from('queues').update({ status: 'finished' }).eq('id', currentPatient.id);

    if (!visitError && !queueError) {
      alert('تم إنهاء الكشف بنجاح');
      fetchQueue(selectedClinic);
    } else {
      alert('حدث خطأ أثناء حفظ البيانات');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* شريط العنوان واختيار العيادة */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-teal-800 text-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <Stethoscope className="w-10 h-10 text-teal-200" />
          <div>
            <h2 className="text-2xl font-bold">بوابة الطبيب</h2>
            <p className="text-teal-200 text-sm mt-1">إدارة الكشف ومتابعة الطابور</p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)} className="p-2 rounded-lg text-slate-800 font-bold focus:outline-none min-w-[200px]">
            <option value="">-- تسجيل الدخول لعيادة --</option>
            {clinics.map(c => <option key={c.id} value={c.id}>عيادة {c.name}</option>)}
          </select>
          <Link href="/" className="text-teal-200 hover:text-white transition-colors bg-teal-900 p-2 rounded-lg">
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {!selectedClinic ? (
        <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Stethoscope size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-xl">يرجى اختيار العيادة من الأعلى للبدء في استقبال المرضى</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. لوحة الكشف (المريض الحالي) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-teal-50 border-b border-teal-100 p-4 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                  <Activity size={20} /> لوحة الكشف الحالية
                </h3>
                
                {/* زر تكرار النداء والشارة */}
                {currentPatient && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleRepeatCall} 
                      disabled={loading}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                      title="إعادة إذاعة النداء على شاشة الاستراحة"
                    >
                      <Volume2 size={16} /> تكرار النداء
                    </button>
                    <span className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold animate-pulse">
                      رقم التذكرة: {currentPatient.ticket_number}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {!currentPatient ? (
                  <div className="text-center py-12 text-slate-400">
                    <p>لا يوجد مريض داخل العيادة حالياً.</p>
                    <p className="text-sm mt-2">قم باستدعاء المريض التالي من قائمة الانتظار.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div><p className="text-xs text-slate-500">اسم المريض</p><p className="font-bold text-slate-800">{currentPatient.patients?.name}</p></div>
                      <div><p className="text-xs text-slate-500">الوزن</p><p className="font-semibold text-slate-700">{currentPatient.visits?.weight || '-'} كجم</p></div>
                      <div><p className="text-xs text-slate-500">الطول</p><p className="font-semibold text-slate-700">{currentPatient.visits?.height || '-'} سم</p></div>
                      <div><p className="text-xs text-slate-500">الضغط</p><p className="font-semibold text-slate-700 text-left dir-ltr">{currentPatient.visits?.blood_pressure || '-'}</p></div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2"><FileText size={16} className="text-teal-600"/> التشخيص الطبي</label>
                      <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 min-h-[100px]"></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">خطة العلاج والملاحظات</label>
                      <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 min-h-[100px]"></textarea>
                    </div>

                    <button onClick={handleFinishVisit} disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                      <CheckCircle size={20} /> {loading ? 'جاري الحفظ...' : 'إنهاء الكشف وحفظ البيانات'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. القائمة الجانبية (البحث وقائمة الانتظار) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* نموذج استدعاء برقم مخصص */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <Search size={18} className="text-blue-500" /> استدعاء برقم التذكرة
              </h3>
              <form onSubmit={handleCallCustomTicket} className="flex gap-2">
                <input 
                  type="number" 
                  value={customTicket} 
                  onChange={(e) => setCustomTicket(e.target.value)} 
                  placeholder="رقم التذكرة..." 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
                <button type="submit" disabled={loading || currentPatient !== null} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                  نداء
                </button>
              </form>
              <p className="text-xs text-slate-500 mt-2">يفيد في حال تأخر المريض أو رغبتك في نداء حالة غير مرتبة.</p>
            </div>

            {/* قائمة الانتظار */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-amber-500" /> الانتظار
                </h3>
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
                  {waitingQueue.length} مرضى
                </span>
              </div>
              
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {waitingQueue.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">لا يوجد مرضى في الانتظار حالياً.</p>
                ) : (
                  waitingQueue.map((queue) => (
                    <div key={queue.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{queue.ticket_number}</p>
                        <p className="text-xs text-slate-500">{queue.patients?.name}</p>
                      </div>
                      <button 
                        onClick={() => handleCallNext(queue.id)}
                        disabled={loading || currentPatient !== null}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-sm px-4 py-2 rounded font-bold transition-colors"
                      >
                        استدعاء
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>

        </div>
      )}
    </div>
  );
}
