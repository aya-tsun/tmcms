import React, { useState, useEffect } from 'react';
import { axesApi } from '../api';
import type { CustomAxis } from '../types';
import Layout from '../components/Layout';

export default function SettingsPage() {
  const [axes, setAxes] = useState<CustomAxis[]>([]);
  const [newAxisName, setNewAxisName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    axesApi.list().then((res) => {
      setAxes(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAxisName.trim()) return;
    setSaving(true);
    try {
      const res = await axesApi.create({ name: newAxisName.trim(), order: axes.length });
      setAxes((prev) => [...prev, res.data]);
      setNewAxisName('');
    } catch (err: any) {
      alert(err.response?.data?.detail || '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (axis: CustomAxis) => {
    if (!confirm(`評価軸「${axis.name}」を削除しますか？\n既存の評価データには影響しません。`)) return;
    try {
      await axesApi.delete(axis.id);
      setAxes((prev) => prev.filter((a) => a.id !== axis.id));
    } catch (err: any) {
      alert(err.response?.data?.detail || '削除に失敗しました');
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#4c1d95' }}>設定</h1>

      {/* Custom evaluation axes */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6 max-w-xl">
        <h2 className="text-base font-semibold text-purple-700 mb-1">カスタム評価軸</h2>
        <p className="text-xs text-purple-300 mb-5">
          教材評価に追加する独自の評価軸を設定できます（最大3軸）
        </p>

        {/* Existing axes */}
        {loading ? (
          <div className="text-center py-6 text-purple-300">読み込み中...</div>
        ) : axes.length === 0 ? (
          <div className="text-purple-300 text-sm mb-4">カスタム評価軸は設定されていません</div>
        ) : (
          <div className="space-y-2 mb-4">
            {axes.map((axis, i) => (
              <div
                key={axis.id}
                className="flex items-center justify-between border-2 border-purple-100 rounded-xl px-4 py-3 bg-purple-50/30"
              >
                <div>
                  <span className="text-xs text-purple-300 mr-2 font-medium">#{i + 1}</span>
                  <span className="font-semibold text-purple-700">{axis.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(axis)}
                  className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new axis */}
        {axes.length < 3 ? (
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newAxisName}
              onChange={(e) => setNewAxisName(e.target.value)}
              placeholder="例: 実務への応用度"
              className="flex-1 border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 transition-all"
            />
            <button
              type="submit"
              disabled={!newAxisName.trim() || saving}
              className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
            >
              {saving ? '追加中...' : '追加'}
            </button>
          </form>
        ) : (
          <div className="bg-amber-50 text-amber-600 text-sm px-4 py-3 rounded-xl border border-amber-100">
            カスタム評価軸は最大3つまでです
          </div>
        )}
      </div>
    </Layout>
  );
}
