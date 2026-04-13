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
      <h1 className="text-2xl font-bold text-slate-800 mb-6">タグ管理</h1>

      {/* Add tag form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-700 mb-3">新しいタグを追加</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="タグ名（例: Python、AWS、Docker）"
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!newTagName.trim() || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {saving ? '追加中...' : '追加'}
          </button>
        </form>
      </div>

      {/* Tag list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">タグ一覧</h2>
          <span className="text-sm text-slate-400">{tags.length}件</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-3xl mb-2">🏷️</div>
            タグがありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-600">タグ名</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-600">教材数</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-600">登録日</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-right font-semibold text-slate-600">操作</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      {tag.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-slate-700 font-medium">{tag.material_count}</span>
                    <span className="text-slate-400 text-xs ml-1">件</span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded transition-colors"
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
