'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Box, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';

export default function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('مستهلكات طبية');
  const [quantity, setQuantity] = useState('');
  const [minStock, setMinStock] = useState('5');

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('item_name', { ascending: true });

    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return alert('اسم الصنف مطلوب');

    const newItem = {
      item_name: itemName,
      category: category,
      quantity: parseInt(quantity) || 0,
      minimum_stock: parseInt(minStock) || 5
    };

    const { error } = await supabase.from('inventory').insert([newItem]);
    if (error) {
      alert('خطأ في الإضافة');
    } else {
      setItemName(''); setQuantity(''); setMinStock('5');
      fetchInventory();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الصنف؟')) return;
    await supabase.from('inventory').delete().eq('id', id);
    fetchInventory();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Box className="text-primary" />
        المخزن الطبي والمستهلكات
      </h2>

      <form onSubmit={handleAddItem} className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">اسم الصنف</label>
          <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" required />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">التصنيف</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:border-primary focus:outline-none">
            <option value="مستهلكات طبية">مستهلكات طبية</option>
            <option value="أدوية طوارئ">أدوية طوارئ</option>
            <option value="أدوات تعقيم ونظافة">أدوات تعقيم ونظافة</option>
            <option value="مطبوعات ورقية">مطبوعات ورقية</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">الرصيد الحالي</label>
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:border-primary focus:outline-none" required />
        </div>
        <button type="submit" className="bg-primary text-white p-2 rounded-lg hover:bg-teal-800 transition-colors flex items-center justify-center gap-2">
          <PlusCircle size={20} />
          إضافة
        </button>
      </form>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th className="p-4 font-semibold">الصنف</th>
              <th className="p-4 font-semibold">التصنيف</th>
              <th className="p-4 font-semibold text-center">الرصيد</th>
              <th className="p-4 font-semibold text-center">حالة المخزون</th>
              <th className="p-4 font-semibold text-center">حذف</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.quantity <= item.minimum_stock;
              return (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{item.item_name}</td>
                  <td className="p-4 text-sm text-slate-600">{item.category}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{item.quantity}</td>
                  <td className="p-4 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold animate-pulse">
                        <AlertTriangle size={14} /> يحتاج لشراء
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">متوفر</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">المخزن فارغ حالياً</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
