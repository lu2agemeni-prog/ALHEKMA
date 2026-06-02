'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { UserPlus, Trash2, Shield, Stethoscope, UserCheck, Wrench } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالة النموذج
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('reception');
  const [clinicId, setClinicId] = useState('');
  const [salary, setSalary] = useState('');

  const fetchData = async () => {
    setLoading(true);
    // جلب الموظفين مع اسم العيادة المرتبطة (إن وجدت)
    const { data: staffData } = await supabase
      .from('staff')
      .select('*, clinics(name)')
      .order('created_at', { ascending: false });
    
    // جلب العيادات لاستخدامها في قائمة الاختيار للأطباء
    const { data: clinicsData } = await supabase
      .from('clinics')
      .select('id, name');

    setStaff(staffData || []);
    setClinics(clinicsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return alert('الاسم والدور الوظيفي مطلوبان');

    const newStaff = {
      name,
      phone,
      role,
      clinic_id: role === 'doctor' ? clinicId : null,
      salary: salary ? parseFloat(salary) : null
    };

    const { error } = await supabase.from('staff').insert([newStaff]);
    
    if (error) {
      console.error('Error adding staff:', error);
      alert('حدث خطأ أثناء الإضافة');
    } else {
      setName(''); setPhone(''); setSalary(''); setRole('reception'); setClinicId('');
      fetchData();
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    await supabase.from('staff').delete().eq('id', id);
    fetchData();
  };

  const roleIcons: Record<string, JSX.Element> = {
    admin: <Shield size={16} className="text-red-500" />,
    doctor: <Stethoscope size={16} className="text-teal-500" />,
    reception: <UserCheck size={16} className="text-blue-500" />,
    worker: <Wrench size={16} className="text-slate-500" />
  };

  const roleNames: Record<string, string> = {
    admin: 'مدير نظام',
    doctor: 'طبيب',
    reception: 'استقبال',
    worker: 'عامل/فني'
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">إدارة الطاقم الطبي والموظفين</h2>

      <form onSubmit={handleAddStaff} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
