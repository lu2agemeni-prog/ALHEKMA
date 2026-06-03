'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { UserPlus, Trash2, UserCircle } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات النموذج
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reception');
  const [clinicId, setClinicId] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState('monthly'); // الحالة الجديدة لنوع المحاسبة

  const fetchData = async () => {
    setLoading(true);
    const { data: clinicsData } = await supabase.from('clinics').select('id, name');
    if (clinicsData) setClinics(clinicsData);

    const { data: staffData, error } = await supabase
      .from('staff')
      .select('*, clinics(name)')
      .order('created_at', { ascending: false });
      
    if (error) console.error('Error fetching staff:', error);
    else setStaff(staffData || []);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return alert('يرجى إدخال الاسم والبريد الإلكتروني');
    if (role === 'doctor' && !clinicId) return alert('يرجى تحديد العيادة للطبيب');

    const newStaff = {
      name,
      phone,
      email,
      role,
      salary: salary ? parseFloat(salary) : null,
      salary_type: salaryType, // إرسال نوع الراتب لقاعدة البيانات
      clinic_id: role === 'doctor' ? clinicId : null, 
    };

    const { error } = await supabase.from('staff').insert([newStaff]);
    
    if (error) {
      console.error('Error adding staff:', error);
      alert('حدث خطأ أثناء الإضافة. قد يكون البريد الإلكتروني مسجلاً مسبقاً.');
    } else {
      setName(''); setPhone(''); setEmail(''); setRole('reception');
      setClinicId(''); setSalary(''); setSalaryType('monthly');
      fetchData();
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) fetchData();
  };

  const getRoleName = (roleValue: string) => {
    const roles: any = { admin: 'مدير النظام', doctor: 'طبيب', reception: 'استقبال', worker: 'عامل' };
    return roles[roleValue] || roleValue;
  };

  // دالة لتنسيق عرض الراتب في الجدول
  const formatSalary = (val: number, type: string) => {
    if (!val) return '-';
    if (type === 'percentage') return <span className="text-purple-600 font-bold">{val}% من الكشف</span>;
    if (type === 'daily') return <span className="text-amber-600 font-bold">{val} ج / يوم</span>;
    return <span className="text-green-600 font-bold">{val} ج / شهر</span>;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <UserCircle className="text-primary" />
        إدارة الطاقم والموظفين
      </h2>

      <form onSubmit={handleAddStaff} className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">إضافة فرد جديد للطاقم</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="lg:col-span-2">
            <label className="block text-sm text-slate-600 mb-1">الاسم رباعي</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">البريد الإلكتروني (للدخول)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" />
          </div>
          
          <div>
            <label className="block text-sm text-slate-600 mb-1">المسمى الوظيفي</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-primary focus:outline-none">
              <option value="reception">استقبال وتسجيل</option>
              <option value="doctor">طبيب</option>
              <option value="admin">مدير</option>
              <option value="worker">خدمات معاونة (عامل)</option>
            </select>
          </div>

          {/* التعديل الجديد: تحديد طريقة المحاسبة */}
          <div>
            <label className="block text-sm text-slate-600 mb-1">طريقة المحاسبة</label>
            <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-primary focus:outline-none">
              <option value="monthly">راتب شهري ثابت</option>
              <option value="daily">يومية ثابتة</option>
              <option value="percentage">نسبة من الكشوفات</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              {salaryType === 'percentage' ? 'النسبة المئوية (%)' : 'المبلغ المالي (ج.م)'}
            </label>
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder={salaryType === 'percentage' ? "مثال: 40" : "مثال: 3000"} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" />
          </div>
          
          {role === 'doctor' && (
            <div>
              <label className="block text-sm font-bold text-teal-800 mb-1">تحديد العيادة</label>
              <select value={clinicId} onChange={(e) => setClinicId(e.target.value)} className="w-full p-2 border border-teal-300 rounded-lg bg-teal-50 focus:border-teal-600 focus:outline-none" required>
                <option value="">-- اختر العيادة --</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t pt-4 mt-2">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800">
            <UserPlus size={20} /> تسجيل الموظف
          </button>
        </div>
      </form>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-4 font-semibold">الاسم</th>
              <th className="p-4 font-semibold">الوظيفة</th>
              <th className="p-4 font-semibold">العيادة</th>
              <th className="p-4 font-semibold">المحاسبة المالية</th>
              <th className="p-4 font-semibold text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">
                  {member.name}
                  <div className="text-xs text-slate-400 mt-1">{member.email}</div>
                </td>
                <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{getRoleName(member.role)}</span></td>
                <td className="p-4 text-slate-600">{member.clinics?.name || '-'}</td>
                <td className="p-4">{formatSalary(member.salary, member.salary_type)}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDeleteStaff(member.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
