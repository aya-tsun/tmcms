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

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">ユーザー管理</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + ユーザー追加
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名前</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  パスワード{editingUser && ' （変更する場合のみ入力）'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editingUser}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ロール</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as 'admin' | 'member' }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-slate-300 px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  {saving ? '保存中...' : editingUser ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">読み込み中...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-600">名前</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-600">メールアドレス</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-600">ロール</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-600">登録日</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-slate-400">（自分）</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === 'admin'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role === 'admin' ? '管理者' : 'メンバー'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="text-xs border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-50 transition-colors"
                      >
                        編集
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs border border-red-200 text-red-500 px-2.5 py-1 rounded hover:bg-red-50 transition-colors"
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
