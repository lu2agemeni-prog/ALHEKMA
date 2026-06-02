'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Stethoscope, Users, CheckCircle, ArrowRight, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DoctorPortal() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // بيانات الطابور والمريض الحالي
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [currentPatient, setCurrentPatient] = useState<any | null>(null);
  
  // المدخلات الطبية
  const [diagnosis, setDiagnosis] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // جلب قائمة العيادات عند فتح الصفحة
  useEffect(() => {
    const fetchClinics = async () => {
      const { data } = await supabase.from('clinics').select('*');
      if (data) setClinics(data);
    };
    fetchClinics();
  }, []);

  // جلب طابور العيادة المحددة (المرضى في الانتظار والمريض الحالي داخل العيادة)
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
      // فصل المريض الموجود حالياً داخل العيادة عن باقي الطابور
      const inClinic = data.find(q => q.status === 'in_clinic');
      const waiting = data.filter(q => q.status === 'waiting');
      
      setCurrentPatient(inClinic || null);
      setWaitingQueue(waiting);
      
      // جلب التشخيص السابق إن وجد
      if (inClinic?.visits) {
        setDiagnosis(inClinic.visits.diagnosis || '');
        setMedicalNotes(inClinic.visits.medical_notes || '');
      } else {
        setDiagnosis('');
        setMedicalNotes('');
      }
    }
  };

  // تحديث البيانات عند تغيير العيادة
  useEffect(() => {
    if (selectedClinic) {
      fetchQueue(selectedClinic);
    } else {
      setWaitingQueue([]);
      setCurrentPatient(null);
    }
  }, [selectedClinic]);

  // استدعاء المريض التالي
  const handleCallNext = async (queueId: string) => {
    setLoading(true);
    // إذا كان هناك مريض حالي ولم يتم إنهاء كشفه، لا يمكن استدعاء جديد
    if (currentPatient) {
      alert('يرجى إنهاء كشف المريض الحالي أولاً');
      setLoading(false);
      return;
    }

    // تحديث حالة المريض في الطابور إلى "داخل العيادة"
    const { error } = await supabase
      .from('queues')
      .update({ status: 'in_clinic' })
      .eq('id', queueId);

    if (!error) fetchQueue(selectedClinic);
    setLoading(false);
  };

  // إنهاء الكشف وحفظ البيانات
  const handleFinishVisit = async () => {
    if (!currentPatient) return;
    setLoading(true);

    // 1. حفظ التشخيص في جدول الزيارات
    const { error: visitError } = await supabase
      .from('visits')
      .update({ 
        diagnosis: diagnosis,
        medical_notes: medicalNotes
      })
      .eq('id', currentPatient.visit_id);

    // 2. تحديث حالة الطابور إلى "تم الكشف"
    const { error: queueError } = await supabase
      .from('queues')
      .update({ status: 'finished' })
      .eq('id', currentPatient.id);

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-teal-800 text-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <Stethoscope className="w-10 h-10 text-teal-200" />
          <div>
            <h2 className="text-2xl font-bold">بوابة الطبيب</h2>
            <p className="text-teal-200 text-sm mt-1">إدارة الكشف ومتابعة الطابور</p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <select 
            value={selectedClinic} 
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="p-2 rounded-lg text-slate-800 font-bold focus:outline-none min-w-[200px]"
          >
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
          
          {/* لوحة الكشف (المريض الحالي) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-teal-50 border-b border-teal-100 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-teal-800 flex items-center gap-2">
                  <Activity size={20} /> لوحة الكشف الحالية
                </h3>
                {currentPatient && (
                  <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                    رقم التذكرة: {currentPatient.ticket_number}
                  </span>
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
                    {/* بيانات المريض */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">اسم المريض</p>
                        <p className="font-bold text-slate-800">{currentPatient.patients.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">الوزن</p>
                        <p className="font-semibold text-slate-700">{currentPatient.visits.weight || '-'} كجم</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">الطول</p>
                        <p className="font-semibold text-slate-700">{currentPatient.visits.height || '-'} سم</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">الضغط</p>
                        <p className="font-semibold text-slate-700 text-left dir-ltr">{currentPatient.visits.blood_pressure || '-'}</p>
                      </div>
                    </div>

                    {/* إدخال التشخيص */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <FileText size={16} className="text-teal-600"/> التشخيص الطبي
                      </label>
                      <textarea 
                        value={diagnosis} 
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 min-h-[100px]"
                        placeholder="اكتب تشخيص الحالة هنا..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">خطة العلاج والملاحظات</label>
                      <textarea 
                        value={medicalNotes} 
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-500 min-h-[100px]"
                        placeholder="الأدوية المطلوبة، التحاليل، أو تعليمات المريض..."
                      ></textarea>
                    </div>

                    <button 
                      onClick={handleFinishVisit} 
                      disabled={loading}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={20} />
                      {loading ? 'جاري الحفظ...' : 'إنهاء الكشف وحفظ البيانات'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* قائمة الانتظار (الطابور) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users size={20} className="text-amber-500" /> قائمة الانتظار
                </h3>
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
                  {waitingQueue.length} مرضى
                </span>
              </div>
              
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {waitingQueue.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">لا يوجد مرضى في الانتظار حالياً.</p>
                ) : (
                  waitingQueue.map((queue) => (
                    <div key={queue.id} className="p-3 border border-slate-200 rounded-lg flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-lg">{queue.ticket_number}</p>
                        <p className="text-xs text-slate-500">{queue.patients.name}</p>
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
