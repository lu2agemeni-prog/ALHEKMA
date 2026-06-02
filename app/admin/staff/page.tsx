'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { UserPlus, Trash2, UserCircle } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات النموذج (Form States)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('reception');
  const [clinicId, setClinicId] = useState('');
  const [salary, setSalary] = useState('');

  // جلب الموظفين والعيادات
  const fetchData = async () => {
    setLoading(true);
    
    // جلب العيادات لاستخدامها في قائمة الاختيار للأطباء
    const { data: clinicsData } = await supabase.from('clinics').select('id, name');
    if (clinicsData) setClinics(clinicsData);

    // جلب الموظفين مع ربط جدول العيادات لمعرفة اسم عيادة الطبيب
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

  // إضافة موظف جديد
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('يرجى إدخال اسم الموظف');
    if (role === 'doctor' && !clinicId) return alert('يرجى تحديد العيادة للطبيب');

    const newStaff = {
      name,
      phone,
      role,
      salary: salary ? parseFloat(salary) : null,
      // نرسل الـ clinic_id فقط إذا كان طبيباً، وإلا نرسل null حتى لا تحدث مشكلة في قاعدة البيانات
      clinic_id: role === 'doctor' ? clinicId : null, 
    };

    const { error } = await supabase.from('staff').insert([newStaff]);
    
    if (error) {
      console.error('Error adding staff:', error);
      alert('حدث خطأ أثناء الإضافة. تأكد من صحة البيانات.');
    } else {
      // تفريغ الحقول بعد الإضافة
      setName('');
      setPhone('');
      setRole('reception');
      setClinicId('');
      setSalary('');
      fetchData();
    }
  };

  // حذف موظف
  const handleDeleteStaff = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) console.error('Error deleting staff:', error);
    else fetchData();
  };

  // دالة مساعدة لترجمة الأدوار للعربية في الجدول
  const getRoleName = (roleValue: string) => {
    const roles: any = {
      admin: 'مدير النظام',
      doctor: 'طبيب',
      reception: 'استقبال وتسجيل',
      worker: 'خدمات معاونة'
    };
    return roles[roleValue] || roleValue;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <UserCircle className="text-primary" />
        إدارة الطاقم والموظفين
      </h2>

      {/* نموذج إضافة موظف جديد */}
      <form onSubmit={handleAddStaff} className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">إضافة فرد جديد للطاقم</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">الاسم رباعي</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary" required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">رقم الهاتف</label>
            <input 
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">المسمى الوظيفي</label>
            <select 
              value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
            >
              <option value="reception">استقبال وتسجيل</option>
              <option value="doctor">طبيب</option>
              <option value="worker">خدمات معاونة (عامل)</option>
              <option value="admin">مدير</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">الراتب الأساسي</label>
            <input 
              type="number" value={salary} onChange={(e) => setSalary(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* يظهر هذا الحقل فقط إذا كان الدور المختار هو طبيب */}
        {role === 'doctor' && (
          <div className="mb-4 p-4 bg-teal-50 border border-teal-100 rounded-lg animate-in fade-in slide-in-from-top-2">
            <label className="block text-sm font-semibold text-teal-800 mb-1">تحديد العيادة للطبيب</label>
            <select 
              value={clinicId} onChange={(e) => setClinicId(e.target.value)}
              className="w-full md:w-1/2 p-2 border border-teal-300 rounded-lg focus:outline-none focus:border-teal-600 bg-white"
              required
            >
              <option value="">-- اختر العيادة --</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800 transition-colors">
            <UserPlus size={20} />
            تسجيل الموظف
          </button>
        </div>
      </form>

      {/* جدول عرض الطاقم */}
      {loading ? (
        <p className="text-center text-slate-500 my-8">جاري تحميل البيانات...</p>
      ) : staff.length === 0 ? (
        <p className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg border border-slate-100">لا يوجد موظفين مضافين حتى الآن.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold">الاسم</th>
                <th className="p-4 font-semibold">الوظيفة</th>
                <th className="p-4 font-semibold">العيادة (للأطباء)</th>
                <th className="p-4 font-semibold">رقم الهاتف</th>
                <th className="p-4 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{member.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.role === 'doctor' ? 'bg-teal-100 text-teal-800' : 
                      member.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      member.role === 'reception' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {getRoleName(member.role)}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {member.clinics?.name ? (
                      <span className="font-semibold text-teal-700">{member.clinics.name}</span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-slate-600">{member.phone || '-'}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDeleteStaff(member.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="حذف الموظف"
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
