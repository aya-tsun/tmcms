import React, { useState, useEffect } from 'react';
import { tagsApi } from '../api';
import type { Tag } from '../types';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/auth';

export default function TagManagePage() {
  const { user } = useAuthStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tagsApi.list().then((res) => {
      setTags(res.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setSaving(true);
    try {
      const res = await tagsApi.create(newTagName.trim());
      setTags((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'タグの作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tagId: number, tagName: string) => {
    if (!confirm(`タグ「${tagName}」を削除しますか？\n教材との紐付けも解除されます。`)) return;
    try {
      await tagsApi.delete(tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch (err: any) {
      alert(err.response?.data?.detail || '削除に失敗しました');
    }
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#4c1d95' }}>タグ管理</h1>

      {/* Add tag form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-purple-700 mb-3">新しいタグを追加</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="タグ名（例: Python、AWS、Docker）"
            className="flex-1 border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 transition-all"
          />
          <button
            type="submit"
            disabled={!newTagName.trim() || saving}
            className="text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
          >
            {saving ? '追加中...' : '追加'}
          </button>
        </form>
      </div>

      {/* Tag list */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-purple-50 flex items-center justify-between" style={{ backgroundColor: '#faf5ff' }}>
          <h2 className="font-semibold text-purple-700">タグ一覧</h2>
          <span className="text-sm text-purple-300">{tags.length}件</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-purple-300">読み込み中...</div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 text-purple-300">
            <div className="text-3xl mb-2">🏷️</div>
            タグがありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-purple-50" style={{ backgroundColor: '#faf5ff' }}>
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-purple-600">タグ名</th>
                <th className="px-6 py-3 text-center font-semibold text-purple-600">教材数</th>
                <th className="px-6 py-3 text-left font-semibold text-purple-600">登録日</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-right font-semibold text-purple-600">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-xs font-semibold border border-violet-100">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className="text-slate-700 font-semibold">{tag.material_count}</span>
                    <span className="text-purple-300 text-xs ml-1">件</span>
                  </td>
                  <td className="px-6 py-3.5 text-purple-300 text-xs">
                    {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-all"
                      >
                        削除
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
