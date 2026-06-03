'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // 1. تسجيل الدخول عبر Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      setLoading(false);
      return;
    }

    // 2. جلب بيانات الموظف والصلاحية من جدول staff
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('role, clinic_id, name')
      .eq('email', email)
      .single();

    if (staffError || !staffData) {
      setErrorMsg('هذا الحساب غير مسجل ضمن طاقم العمل.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // حفظ بيانات الموظف محلياً لتسهيل الاستخدام
    localStorage.setItem('userRole', staffData.role);
    localStorage.setItem('userName', staffData.name);
    if (staffData.clinic_id) localStorage.setItem('clinicId', staffData.clinic_id);

    // 3. التوجيه بناءً على الصلاحية
    if (staffData.role === 'admin') router.push('/admin');
    else if (staffData.role === 'doctor') router.push('/doctor');
    else if (staffData.role === 'reception') router.push('/reception');
    else {
      setErrorMsg('ليس لديك صلاحية الدخول لواجهات النظام.');
      await supabase.auth.signOut();
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-primary p-6 text-center text-white">
          <ShieldCheck size={48} className="mx-auto mb-3 text-teal-200" />
          <h1 className="text-2xl font-bold">بوابة الدخول الموحدة</h1>
          <p className="text-teal-100 text-sm mt-1">نظام إدارة العيادات الذكي</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold text-center border border-red-200">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 text-slate-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                placeholder="admin@clinic.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-slate-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
