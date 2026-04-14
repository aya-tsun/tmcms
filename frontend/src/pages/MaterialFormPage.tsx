import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { materialsApi, tagsApi } from '../api';
import type { Tag } from '../types';
import Layout from '../components/Layout';

const PROVIDERS = ['Udemy', 'Coursera', '自社', 'LinkedIn Learning', 'Pluralsight', 'その他'];
const LEVELS = ['入門', '初級', '中級', '上級'];
const LANGUAGES = ['日本語', '英語', 'その他'];

interface FormState {
  name: string;
  url: string;
  provider: string;
  duration: string;
  cost: string;
  level: string;
  language: string;
  description: string;
  tag_ids: number[];
}

export default function MaterialFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>({
    name: '',
    url: '',
    provider: '',
    duration: '',
    cost: '',
    level: '',
    language: '',
    description: '',
    tag_ids: [],
  });

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    tagsApi.list().then((res) => setAllTags(res.data));
    if (isEdit && id) {
      materialsApi.get(Number(id)).then((res) => {
        const m = res.data;
        setForm({
          name: m.name,
          url: m.url,
          provider: m.provider,
          duration: m.duration?.toString() || '',
          cost: m.cost?.toString() || '',
          level: m.level || '',
          language: m.language || '',
          description: m.description || '',
          tag_ids: m.tags.map((t) => t.id),
        });
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '教材名は必須です';
    if (!form.url.trim()) {
      errs.url = 'URLは必須です';
    } else if (!form.url.startsWith('http://') && !form.url.startsWith('https://')) {
      errs.url = 'URLはhttp://またはhttps://で始まる必要があります';
    }
    if (!form.provider.trim()) errs.provider = '提供元は必須です';
    if (form.duration && isNaN(Number(form.duration))) errs.duration = '数値を入力してください';
    if (form.cost && isNaN(Number(form.cost))) errs.cost = '数値を入力してください';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        provider: form.provider.trim(),
        duration: form.duration ? Number(form.duration) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        level: form.level || undefined,
        language: form.language || undefined,
        description: form.description.trim() || undefined,
        tag_ids: form.tag_ids,
      };
      if (isEdit && id) {
        await materialsApi.update(Number(id), payload);
        navigate(`/materials/${id}`);
      } else {
        const res = await materialsApi.create(payload);
        navigate(`/materials/${res.data.id}`);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setErrors({ form: detail });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await tagsApi.create(newTagName.trim());
      setAllTags((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, tag_ids: [...f.tag_ids, res.data.id] }));
      setNewTagName('');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'タグの作成に失敗しました');
    }
  };

  const toggleTag = (tagId: number) => {
    setForm((f) => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId)
        ? f.tag_ids.filter((x) => x !== tagId)
        : [...f.tag_ids, tagId],
    }));
  };

  const field = (key: keyof FormState) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const inputClass = (hasError?: boolean) =>
    `w-full border-2 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'border-red-300 focus:ring-red-200'
        : 'border-purple-100 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30'
    }`;

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-purple-300">読み込み中...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <nav className="text-sm text-purple-400 mb-5">
        <Link to="/" className="hover:text-violet-600 transition-colors">教材一覧</Link>
        {isEdit && id && (
          <>
            <span className="mx-2">/</span>
            <Link to={`/materials/${id}`} className="hover:text-violet-600 transition-colors">教材詳細</Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span style={{ color: '#4c1d95' }}>{isEdit ? '編集' : '新規登録'}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6" style={{ color: '#4c1d95' }}>
        {isEdit ? '教材を編集' : '教材を登録'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {errors.form && (
          <div className="bg-red-50 text-red-500 px-4 py-3 rounded-2xl border border-red-100 text-sm">
            {errors.form}
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-purple-700 border-b border-purple-50 pb-2">基本情報</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1.5">
              教材名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              {...field('name')}
              placeholder="例: Python入門コース"
              className={inputClass(!!errors.name)}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1.5">
              URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              {...field('url')}
              placeholder="https://www.udemy.com/course/..."
              className={inputClass(!!errors.url)}
            />
            {errors.url && <p className="text-red-400 text-xs mt-1">{errors.url}</p>}
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1.5">
              提供元 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, provider: p }))}
                  className={`text-sm px-4 py-1.5 rounded-full border-2 transition-all font-medium ${
                    form.provider === p
                      ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                      : 'border-purple-200 text-purple-600 hover:border-violet-400 hover:bg-violet-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              placeholder="または直接入力"
              className={inputClass(!!errors.provider)}
            />
            {errors.provider && <p className="text-red-400 text-xs mt-1">{errors.provider}</p>}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-purple-700 border-b border-purple-50 pb-2">詳細情報（任意）</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-1.5">受講時間（時間）</label>
              <input
                type="number"
                min="0"
                step="0.5"
                {...field('duration')}
                placeholder="例: 10.5"
                className={inputClass(!!errors.duration)}
              />
              {errors.duration && <p className="text-red-400 text-xs mt-1">{errors.duration}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-1.5">費用（円/ライセンス）</label>
              <input
                type="number"
                min="0"
                {...field('cost')}
                placeholder="例: 3000"
                className={inputClass(!!errors.cost)}
              />
              {errors.cost && <p className="text-red-400 text-xs mt-1">{errors.cost}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-purple-700 mb-1.5">説明・備考</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              placeholder="教材の概要、特徴、社内での利用実績など自由に記入してください"
              className="w-full border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 resize-y transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-1.5">対象レベル</label>
              <select
                {...field('level')}
                className={inputClass()}
              >
                <option value="">選択してください</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-700 mb-1.5">言語</label>
              <select
                {...field('language')}
                className={inputClass()}
              >
                <option value="">選択してください</option>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6">
          <h2 className="font-semibold text-purple-700 border-b border-purple-50 pb-2 mb-4">タグ</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {allTags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium ${
                  form.tag_ids.includes(t.id)
                    ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                    : 'border-purple-200 text-purple-600 hover:border-violet-400 hover:bg-violet-50'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="新しいタグを追加"
              className="flex-1 border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 transition-all"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="border-2 border-purple-200 px-4 py-2 rounded-xl text-sm text-purple-600 hover:bg-violet-50 hover:border-violet-400 transition-all font-medium"
            >
              追加
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-white px-7 py-2.5 rounded-2xl font-semibold disabled:opacity-60 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
          >
            {saving ? '保存中...' : isEdit ? '更新する' : '登録する'}
          </button>
          <Link
            to={isEdit ? `/materials/${id}` : '/'}
            className="border-2 border-purple-200 text-purple-600 px-7 py-2.5 rounded-2xl font-semibold hover:bg-purple-50 transition-all"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </Layout>
  );
}
