'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function ClinicsManagement() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [loading, setLoading] = useState(true);

  // دالة لجلب العيادات من قاعدة البيانات
  const fetchClinics = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clinics').select('*').order('created_at', { ascending: true });
    if (error) console.error('Error fetching clinics:', error);
    else setClinics(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // دالة لإضافة عيادة جديدة
  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('يرجى إدخال اسم العيادة');

    const { error } = await supabase.from('clinics').insert([{ name, room_number: roomNumber }]);
    
    if (error) {
      console.error('Error adding clinic:', error);
      alert('حدث خطأ أثناء الإضافة');
    } else {
      setName('');
      setRoomNumber('');
      fetchClinics(); // تحديث القائمة بعد الإضافة
    }
  };

  // دالة لحذف عيادة
  const handleDeleteClinic = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟')) return;
    
    const { error } = await supabase.from('clinics').delete().eq('id', id);
    if (error) console.error('Error deleting clinic:', error);
    else fetchClinics();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إدارة العيادات</h2>

      {/* نموذج إضافة عيادة جديدة */}
      <form onSubmit={handleAddClinic} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm text-slate-600 mb-1">اسم العيادة (مثال: باطنة، أطفال)</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-sm text-slate-600 mb-1">رقم الغرفة (اختياري)</label>
          <input 
            type="text" 
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-primary"
          />
        </div>
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-teal-800 transition-colors w-full md:w-auto justify-center">
          <PlusCircle size={20} />
          إضافة
        </button>
      </form>

      {/* جدول عرض العيادات */}
      {loading ? (
        <p className="text-center text-slate-500">جاري تحميل البيانات...</p>
      ) : clinics.length === 0 ? (
        <p className="text-center text-slate-500 py-8">لا توجد عيادات مضافة حتى الآن.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="p-3 font-semibold">اسم العيادة</th>
                <th className="p-3 font-semibold">رقم الغرفة</th>
                <th className="p-3 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{clinic.name}</td>
                  <td className="p-3 text-slate-600">{clinic.room_number || '-'}</td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => handleDeleteClinic(clinic.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
