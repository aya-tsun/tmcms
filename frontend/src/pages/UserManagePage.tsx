import React, { useState, useEffect } from 'react';
import { usersApi } from '../api';
import type { User } from '../types';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/auth';

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
}

export default function UserManagePage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>({ name: '', email: '', password: '', role: 'member' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    usersApi.list().then((res) => {
      setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'member' });
    setError('');
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingUser) {
        const payload: any = { name: form.name, email: form.email, role: form.role };
        if (form.password) payload.password = form.password;
        await usersApi.update(editingUser.id, payload);
      } else {
        if (!form.password) { setError('パスワードは必須です'); setSaving(false); return; }
        await usersApi.create(form);
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`ユーザー「${u.name}」を削除しますか？`)) return;
    try {
      await usersApi.delete(u.id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || '削除に失敗しました');
    }
  };

  const inputClass = "w-full border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 transition-all";

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#4c1d95' }}>ユーザー管理</h1>
        <button
          onClick={openCreate}
          className="text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
        >
          + ユーザー追加
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-purple-100">
            <h2 className="text-lg font-bold mb-5" style={{ color: '#4c1d95' }}>
              {editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1.5">名前</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1.5">メールアドレス</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1.5">
                  パスワード{editingUser && ' （変更する場合のみ入力）'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editingUser}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-700 mb-1.5">ロール</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'member' }))}
                  className={inputClass}
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              {error && (
                <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-xl border border-red-100">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border-2 border-purple-200 px-5 py-2 rounded-xl text-sm text-purple-600 hover:bg-purple-50 transition-all font-medium"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                >
                  {saving ? '保存中...' : editingUser ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-purple-300">読み込み中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-purple-50" style={{ backgroundColor: '#faf5ff' }}>
              <tr>
                <th className="px-6 py-3.5 text-left font-semibold text-purple-600">名前</th>
                <th className="px-6 py-3.5 text-left font-semibold text-purple-600">メールアドレス</th>
                <th className="px-6 py-3.5 text-center font-semibold text-purple-600">ロール</th>
                <th className="px-6 py-3.5 text-left font-semibold text-purple-600">登録日</th>
                <th className="px-6 py-3.5 text-right font-semibold text-purple-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-slate-700">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-purple-300">（自分）</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500">{u.email}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                        u.role === 'admin'
                          ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                          : 'bg-purple-50 text-purple-500 border-purple-100'
                      }`}
                    >
                      {u.role === 'admin' ? '管理者' : 'メンバー'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-purple-300 text-xs">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs border border-violet-200 text-violet-600 px-2.5 py-1 rounded-lg hover:bg-violet-50 hover:border-violet-400 transition-all"
                      >
                        編集
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs border border-red-100 text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
