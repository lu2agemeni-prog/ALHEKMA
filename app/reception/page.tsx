'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, Ticket, Activity, Printer, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ReceptionPortal() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [todayQueue, setTodayQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // بيانات المريض
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  
  // بيانات الزيارة والعيادة
  const [clinicId, setClinicId] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');

  // جلب العيادات والطابور الحالي
  const fetchData = async () => {
    // جلب العيادات
    const { data: clinicsData } = await supabase.from('clinics').select('*');
    if (clinicsData) setClinics(clinicsData);

    // جلب طابور اليوم لجميع العيادات
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: queueData } = await supabase
      .from('queues')
      .select('*, patients(name), clinics(name)')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (queueData) setTodayQueue(queueData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // دالة تسجيل مريض جديد وقطع تذكرة
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !clinicId) return alert('يرجى إدخال اسم المريض واختيار العيادة');
    
    setLoading(true);
    try {
      // 1. تسجيل المريض (أو يمكن لاحقاً البحث برقم الهاتف إذا كان مسجلاً)
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert([{ name: patientName, phone }])
        .select()
        .single();

      if (patientError) throw patientError;

      // 2. تسجيل الزيارة (القياسات الحيوية)
      const { data: newVisit, error: visitError } = await supabase
        .from('visits')
        .insert([{ 
          patient_id: newPatient.id, 
          clinic_id: clinicId,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          blood_pressure: bloodPressure
        }])
        .select()
        .single();

      if (visitError) throw visitError;

      // 3. تحديد رقم التذكرة (البحث عن آخر رقم في نفس العيادة اليوم)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: existingQueue } = await supabase
        .from('queues')
        .select('ticket_number')
        .eq('clinic_id', clinicId)
        .gte('created_at', today.toISOString());

      let nextTicketNumber = 1;
      if (existingQueue && existingQueue.length > 0) {
        const maxTicket = Math.max(...existingQueue.map(q => q.ticket_number));
        nextTicketNumber = maxTicket + 1;
      }

      // 4. إدخال المريض في الطابور
      const { error: queueError } = await supabase
        .from('queues')
        .insert([{
          clinic_id: clinicId,
          patient_id: newPatient.id,
          visit_id: newVisit.id,
          ticket_number: nextTicketNumber,
          status: 'waiting'
        }]);

      if (queueError) throw queueError;

      alert(`تم بنجاح! رقم المريض في الطابور هو: ${nextTicketNumber}`);
      
      // تفريغ الحقول وتحديث الجدول
      setPatientName(''); setPhone(''); setHeight(''); setWeight(''); setBloodPressure('');
      fetchData();

    } catch (error) {
      console.error('Error in registration:', error);
      alert('حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // ترجمة حالة الطابور
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">في الانتظار</span>;
      case 'in_clinic': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs animate-pulse">داخل العيادة</span>;
      case 'finished': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">تم الكشف</span>;
      default: return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs">ملغى</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <UserCheck className="text-blue-600 w-8 h-8" />
          مكتب الاستقبال والتسجيل
        </h2>
        <Link href="/" className="text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors">
          عودة للرئيسية <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* نموذج تسجيل المريض */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Ticket className="text-blue-500" size={20} />
            تسجيل زيارة وقطع تذكرة
          </h3>
          
          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">اسم المريض</label>
              <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none bg-slate-50" required />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">رقم الهاتف</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none bg-slate-50" />
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm text-slate-600 mb-1">تحويل إلى عيادة</label>
              <select value={clinicId} onChange={(e) => setClinicId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white" required>
                <option value="">-- اختر العيادة --</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Activity size={16} /> القياسات الحيوية (اختياري)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">الوزن (كجم)</label>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: 75" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">الطول (سم)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: 170" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">ضغط الدم</label>
                  <input type="text" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-sm" placeholder="مثال: 120/80" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-70">
              {loading ? 'جاري التسجيل...' : (
                <><Printer size={20} /> حفظ وطباعة التذكرة</>
              )}
            </button>
          </form>
        </div>

        {/* عرض طابور اليوم للمتابعة */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">حركة الطوابير لليوم</h3>
            <span className="text-sm text-slate-500">إجمالي الحالات: {todayQueue.length}</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold">رقم التذكرة</th>
                  <th className="p-4 font-semibold">المريض</th>
                  <th className="p-4 font-semibold">العيادة</th>
                  <th className="p-4 font-semibold">وقت الدخول</th>
                  <th className="p-4 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {todayQueue.map((queue) => (
                  <tr key={queue.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-xl text-slate-700">{queue.ticket_number}</td>
                    <td className="p-4 font-medium text-slate-800">{queue.patients?.name || '-'}</td>
                    <td className="p-4 text-slate-600 font-semibold">{queue.clinics?.name || '-'}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(queue.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">{getStatusBadge(queue.status)}</td>
                  </tr>
                ))}
                {todayQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">لا توجد حالات مسجلة اليوم حتى الآن.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
