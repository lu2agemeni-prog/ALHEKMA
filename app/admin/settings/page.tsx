'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Settings, Save, Download, AlertTriangle, Database, Mic, Play, ArrowRight, ArrowLeft, Hash } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [customTicket, setCustomTicket] = useState('');

  // الإعدادات
  const [settings, setSettings] = useState({
    clinic_name: '', phones: '', address: '', news_ticker: ''
  });

  // الصوتيات
  const [audioList, setAudioList] = useState<any[]>([]);
  const [audioName, setAudioName] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // جلب الإعدادات
    const { data: setts } = await supabase.from('app_settings').select('*');
    if (setts) {
      const sObj: any = {};
      setts.forEach(s => sObj[s.setting_key] = s.setting_value);
      setSettings(sObj as any);
    }
    // جلب العيادات
    const { data: clins } = await supabase.from('clinics').select('*');
    if (clins) setClinics(clins);
    // جلب الصوتيات
    const { data: audios } = await supabase.from('audio_files').select('*').order('created_at', { ascending: false });
    if (audios) setAudioList(audios);
  };

  // 1. حفظ الإعدادات الأساسية
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('app_settings').upsert({ setting_key: key, setting_value: value });
    }
    alert('تم حفظ الإعدادات وتحديث الشاشة بنجاح!');
    setLoading(false);
  };

  // 2. التحكم في الطابور
  const handleQueueControl = async (action: 'next' | 'prev' | 'custom') => {
    if (!selectedClinic) return alert('يرجى اختيار العيادة أولاً');
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetQueue: any = null;

    if (action === 'next') {
      const { data } = await supabase.from('queues').select('*').eq('clinic_id', selectedClinic).eq('status', 'waiting').gte('created_at', today.toISOString()).order('ticket_number', { ascending: true }).limit(1);
      if (data && data.length > 0) targetQueue = data[0];
    } else if (action === 'prev') {
      const { data } = await supabase.from('queues').select('*').eq('clinic_id', selectedClinic).in('status', ['finished', 'in_clinic']).gte('created_at', today.toISOString()).order('ticket_number', { ascending: false }).limit(2);
      if (data && data.length > 1) targetQueue = data[1]; // المريض الذي كان قبل الحالي
    } else if (action === 'custom') {
      if (!customTicket) return alert('أدخل رقم التذكرة');
      const { data } = await supabase.from('queues').select('*').eq('clinic_id', selectedClinic).eq('ticket_number', parseInt(customTicket)).gte('created_at', today.toISOString()).limit(1);
      if (data && data.length > 0) targetQueue = data[0];
    }

    if (targetQueue) {
      await supabase.from('queues').update({ status: 'in_clinic' }).eq('id', targetQueue.id);
      alert(`تم نداء التذكرة رقم ${targetQueue.ticket_number}`);
    } else {
      alert('لم يتم العثور على مريض بهذه المواصفات');
    }
    setLoading(false);
  };

  // 3. رفع الملف الصوتي
  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !audioName) return alert('يرجى إدخال اسم واختيار ملف');
    setLoading(true);

    const fileExt = audioFile.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('audio_files').upload(fileName, audioFile);

    if (uploadError) {
      alert('خطأ في الرفع');
    } else {
      const { data: urlData } = supabase.storage.from('audio_files').getPublicUrl(fileName);
      await supabase.from('audio_files').insert([{ name: audioName, file_url: urlData.publicUrl }]);
      setAudioName(''); setAudioFile(null);
      fetchInitialData();
    }
    setLoading(false);
  };

  // 4. إذاعة الملف الصوتي
  const handleBroadcastAudio = async (url: string) => {
    await supabase.from('screen_events').insert([{ event_type: 'PLAY_AUDIO', payload: { url } }]);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings className="text-primary" /> إعدادات الإدارة المتقدمة
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* قسم التحكم المتقدم بالطابور */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">التحكم في الطابور</h3>
          <div className="space-y-4">
            <select value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-primary focus:outline-none mb-2">
              <option value="">-- اختر العيادة للتحكم --</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            
            <div className="flex gap-2">
              <button onClick={() => handleQueueControl('prev')} disabled={loading} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded flex items-center justify-center gap-1 font-bold">
                <ArrowRight size={18} /> السابق
              </button>
              <button onClick={() => handleQueueControl('next')} disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded flex items-center justify-center gap-1 font-bold">
                التالي <ArrowLeft size={18} />
              </button>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              <input type="number" placeholder="رقم مخصص" value={customTicket} onChange={(e) => setCustomTicket(e.target.value)} className="w-full p-2 border border-slate-300 rounded" />
              <button onClick={() => handleQueueControl('custom')} disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white px-4 rounded flex items-center gap-1">
                <Hash size={18} /> نداء
              </button>
            </div>
          </div>
        </div>

        {/* قسم الإذاعة الصوتية */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Mic className="text-purple-500" /> الإذاعة الصوتية للشاشة
          </h3>
          <form onSubmit={handleUploadAudio} className="flex gap-2 mb-4">
            <input type="text" placeholder="اسم الملف (مثال: نداء للطوارئ)" value={audioName} onChange={(e) => setAudioName(e.target.value)} className="flex-1 p-2 border rounded text-sm" required />
            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="w-24 text-sm" required />
            <button type="submit" disabled={loading} className="bg-purple-600 text-white px-3 rounded hover:bg-purple-700">رفع</button>
          </form>
          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-slate-50 space-y-2">
            {audioList.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-white p-2 border rounded text-sm">
                <span>{a.name}</span>
                <button onClick={() => handleBroadcastAudio(a.file_url)} className="text-green-600 hover:bg-green-50 p-1 rounded flex items-center gap-1 font-bold">
                  <Play size={16} /> إذاعة
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* إعدادات المركز والشريط الإخباري */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">بيانات المركز وشريط الأخبار</h3>
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm mb-1">اسم المجمع</label><input type="text" value={settings.clinic_name || ''} onChange={(e) => setSettings({...settings, clinic_name: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div><label className="block text-sm mb-1">الهواتف</label><input type="text" value={settings.phones || ''} onChange={(e) => setSettings({...settings, phones: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2"><label className="block text-sm mb-1">العنوان</label><input type="text" value={settings.address || ''} onChange={(e) => setSettings({...settings, address: e.target.value})} className="w-full p-2 border rounded" /></div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-amber-600 font-bold">محتوى الشريط الإخباري المتحرك على الشاشة</label>
              <textarea value={settings.news_ticker || ''} onChange={(e) => setSettings({...settings, news_ticker: e.target.value})} className="w-full p-2 border rounded" rows={2}></textarea>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2 rounded flex gap-2"><Save size={18} /> حفظ وتحديث الشاشة</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
