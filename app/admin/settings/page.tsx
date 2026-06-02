'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Settings, Save, Download, AlertTriangle, Database } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);

  // دالة لتصدير الجداول إلى ملفات CSV (نسخة احتياطية)
  const handleExportData = async (tableName: string) => {
    setLoading(true);
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      alert('حدث خطأ أثناء تصدير البيانات');
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      alert('لا توجد بيانات لتصديرها من هذا الجدول');
      setLoading(false);
      return;
    }

    // تحويل البيانات إلى CSV
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => `"${value}"`).join(',')
    ).join('\n');
    
    // إضافة \uFEFF لدعم الحروف العربية في الإكسيل
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName}_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setLoading(false);
  };

  // دالة لمسح طوابير اليوم (تهيئة النظام ليوم جديد)
  const handleClearQueues = async () => {
    if (!confirm('تحذير خطير: هل أنت متأكد من مسح جميع طوابير اليوم؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    setLoading(true);
    // نستخدم شرط غير مساوي لمعرف وهمي لحذف كافة السجلات من جدول الطوابير
    const { error } = await supabase.from('queues').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    
    if (error) alert('حدث خطأ أثناء مسح الطوابير');
    else alert('تم مسح جميع الطوابير بنجاح. النظام جاهز ليوم عمل جديد.');
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Settings className="text-primary" />
        إعدادات النظام والنسخ الاحتياطي
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم بيانات المركز */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">بيانات المركز الأساسية</h3>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('تم الحفظ (واجهة تجريبية)'); }}>
            <div>
              <label className="block text-sm text-slate-600 mb-1">اسم المجمع الطبي</label>
              <input type="text" defaultValue="مجمع عيادات الحكمة" className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">رقم هاتف المركز</label>
              <input type="text" defaultValue="0123456789" className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">العنوان</label>
              <textarea defaultValue="محافظة الجيزة" className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none"></textarea>
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800 transition-colors">
              <Save size={18} /> حفظ التعديلات
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* قسم النسخ الاحتياطي للتنزيل كإكسيل */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Database size={20} className="text-blue-500" />
              النسخ الاحتياطي (تصدير لـ Excel)
            </h3>
            <p className="text-sm text-slate-600 mb-4">يمكنك تحميل نسخة من الجداول بصيغة CSV لفتحها وحفظها كأرشيف.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleExportData('patients')} disabled={loading} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg transition-colors text-sm">
                <Download size={16} /> جدول المرضى
              </button>
              <button onClick={() => handleExportData('finances')} disabled={loading} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg transition-colors text-sm">
                <Download size={16} /> جدول الحسابات
              </button>
              <button onClick={() => handleExportData('visits')} disabled={loading} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg transition-colors text-sm">
                <Download size={16} /> جدول الزيارات
              </button>
              <button onClick={() => handleExportData('inventory')} disabled={loading} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg transition-colors text-sm">
                <Download size={16} /> جدول المخزن
              </button>
            </div>
          </div>

          {/* قسم العمليات الخطيرة */}
          <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
            <h3 className="text-lg font-bold text-red-800 mb-4 border-b border-red-200 pb-2 flex items-center gap-2">
              <AlertTriangle size={20} />
              منطقة الخطر (إدارة الطوابير)
            </h3>
            <p className="text-sm text-red-700 mb-4">
              تستخدم هذه الأداة في نهاية اليوم لمسح طابور اليوم الحالي وتصفير الشاشات استعداداً ليوم عمل جديد غداً.
            </p>
            <button 
              onClick={handleClearQueues} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors font-bold"
            >
              مسح جميع طوابير الانتظار لليوم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
