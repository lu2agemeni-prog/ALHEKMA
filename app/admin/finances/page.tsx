'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Wallet, ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react';

export default function FinancesManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // حالات النموذج
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // إحصائيات
  const [totals, setTotals] = useState({ income: 0, expense: 0, net: 0 });

  const fetchFinances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching finances:', error);
    } else {
      const records = data || [];
      setTransactions(records);
      
      // حساب الإجماليات
      let inc = 0, exp = 0;
      records.forEach(rec => {
        if (rec.transaction_type === 'income') inc += Number(rec.amount);
        else exp += Number(rec.amount);
      });
      setTotals({ income: inc, expense: exp, net: inc - exp });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return alert('يرجى إدخال مبلغ صحيح');
    if (!description) return alert('يرجى كتابة بيان المعاملة');

    const newTx = {
      transaction_type: type,
      amount: Number(amount),
      description
    };

    const { error } = await supabase.from('finances').insert([newTx]);
    
    if (error) {
      console.error('Error adding transaction:', error);
      alert('حدث خطأ أثناء الإضافة');
    } else {
      setAmount('');
      setDescription('');
      fetchFinances();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    const { error } = await supabase.from('finances').delete().eq('id', id);
    if (!error) fetchFinances();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Wallet className="text-primary" />
        المالية والحسابات
      </h2>

      {/* بطاقات الملخص */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700 mb-1">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-green-800">{totals.income} ج.م</p>
          </div>
          <ArrowUpCircle className="text-green-500" size={32} />
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700 mb-1">إجمالي المصروفات</p>
            <p className="text-2xl font-bold text-red-800">{totals.expense} ج.م</p>
          </div>
          <ArrowDownCircle className="text-red-500" size={32} />
        </div>
        <div className={`p-4 border rounded-xl flex items-center justify-between ${totals.net >= 0 ? 'bg-teal-50 border-teal-200' : 'bg-orange-50 border-orange-200'}`}>
          <div>
            <p className={`text-sm mb-1 ${totals.net >= 0 ? 'text-teal-700' : 'text-orange-700'}`}>صافي الربح</p>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-teal-800' : 'text-orange-800'}`}>{totals.net} ج.م</p>
          </div>
          <Wallet className={totals.net >= 0 ? 'text-teal-500' : 'text-orange-500'} size={32} />
        </div>
      </div>

      {/* نموذج الإضافة */}
      <form onSubmit={handleAddTransaction} className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm text-slate-600 mb-1">نوع المعاملة</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white">
            <option value="income">إيرادات (دخل)</option>
            <option value="expense">مصروفات</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">المبلغ</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary" placeholder="0.00" required />
        </div>
        <div className="md:col-span-2 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-slate-600 mb-1">البيان (الوصف)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary" placeholder="مثال: شراء مستلزمات، كشف عيادة..." required />
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap">
            تسجيل
          </button>
        </div>
      </form>

      {/* الجدول */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-4 font-semibold">التاريخ</th>
              <th className="p-4 font-semibold">النوع</th>
              <th className="p-4 font-semibold">البيان</th>
              <th className="p-4 font-semibold">المبلغ</th>
              <th className="p-4 font-semibold text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-sm text-slate-600">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${t.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {t.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                  </span>
                </td>
                <td className="p-4 text-slate-800">{t.description}</td>
                <td className="p-4 font-bold text-slate-700">{t.amount} ج.م</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">لا توجد معاملات مسجلة</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
