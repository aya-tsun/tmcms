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
      <h1 className="text-2xl font-bold text-slate-800 mb-6">設定</h1>

      {/* Custom evaluation axes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-xl">
        <h2 className="text-base font-semibold text-slate-700 mb-1">カスタム評価軸</h2>
        <p className="text-xs text-slate-400 mb-4">
          教材評価に追加する独自の評価軸を設定できます（最大3軸）
        </p>

        {/* Existing axes */}
        {loading ? (
          <div className="text-center py-6 text-slate-400">読み込み中...</div>
        ) : axes.length === 0 ? (
          <div className="text-slate-400 text-sm mb-4">カスタム評価軸は設定されていません</div>
        ) : (
          <div className="space-y-2 mb-4">
            {axes.map((axis, i) => (
              <div
                key={axis.id}
                className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2.5"
              >
                <div>
                  <span className="text-xs text-slate-400 mr-2">#{i + 1}</span>
                  <span className="font-medium text-slate-700">{axis.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(axis)}
                  className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded transition-colors"
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
              placeholder={`例: 実務への応用度`}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={!newAxisName.trim() || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
            >
              {saving ? '追加中...' : '追加'}
            </button>
          </form>
        ) : (
          <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg border border-amber-200">
            カスタム評価軸は最大3つまでです
          </div>
        )}
      </div>
    </Layout>
  );
}
