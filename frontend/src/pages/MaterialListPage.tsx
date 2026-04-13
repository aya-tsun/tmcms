import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { materialsApi, tagsApi, exportApi } from '../api';
import type { Material, Tag, MaterialFilters } from '../types';
import StarRating from '../components/StarRating';
import Layout from '../components/Layout';

const PROVIDERS = ['Udemy', 'Coursera', '自社', 'LinkedIn Learning', 'Pluralsight', 'その他'];
const LEVELS = ['入門', '初級', '中級', '上級'];
const LANGUAGES = ['日本語', '英語', 'その他'];
const SORT_OPTIONS = [
  { value: 'created_at|desc', label: '登録日 (新しい順)' },
  { value: 'created_at|asc', label: '登録日 (古い順)' },
  { value: 'overall_score|desc', label: '評価 (高い順)' },
  { value: 'overall_score|asc', label: '評価 (低い順)' },
  { value: 'name|asc', label: '教材名 (A-Z)' },
  { value: 'name|desc', label: '教材名 (Z-A)' },
];

export default function MaterialListPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [level, setLevel] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('created_at|desc');
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = sort.split('|');
      const params: MaterialFilters & { skip: number; limit: number } = {
        skip: page * LIMIT,
        limit: LIMIT,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search) params.search = search;
      if (provider) params.provider = provider;
      if (category) params.category = category;
      if (selectedTagIds.length > 0) params.tag_ids = selectedTagIds.join(',');
      if (level) params.level = level;
      if (language) params.language = language;

      const res = await materialsApi.list(params);
      setMaterials(res.data.items);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, provider, category, selectedTagIds, level, language, sort, page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    tagsApi.list().then((res) => setTags(res.data));
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 10) next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この教材を削除しますか？')) return;
    await materialsApi.delete(id);
    fetchMaterials();
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (provider) params.provider = provider;
    if (category) params.category = category;
    if (selectedTagIds.length > 0) params.tag_ids = selectedTagIds.join(',');
    if (selected.size > 0) params.material_ids = Array.from(selected).join(',');

    try {
      const fn = format === 'csv' ? exportApi.downloadCsv : exportApi.downloadXlsx;
      const res = await fn(params);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `tmcms_export_${now}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompare = () => {
    if (selected.size < 2) return;
    navigate(`/compare?ids=${Array.from(selected).join(',')}`);
  };

  const resetFilters = () => {
    setSearch('');
    setProvider('');
    setCategory('');
    setSelectedTagIds([]);
    setLevel('');
    setLanguage('');
    setSort('created_at|desc');
    setPage(0);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">教材一覧</h1>
        <Link
          to="/materials/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + 教材登録
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="教材名・提供元で検索"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="カテゴリで絞り込み"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">提供元: すべて</option>
            {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">レベル: すべて</option>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">言語: すべて</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={resetFilters}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            リセット
          </button>
        </div>

        {/* Tag filter */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center">タグ:</span>
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTagIds((prev) =>
                    prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                  );
                  setPage(0);
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selectedTagIds.includes(t.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-slate-500">
          全 {total} 件
          {selected.size > 0 && (
            <span className="ml-2 text-blue-600 font-medium">{selected.size} 件選択中</span>
          )}
        </div>
        <div className="flex gap-2">
          {selected.size >= 2 && (
            <button
              onClick={handleCompare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              比較 ({selected.size})
            </button>
          )}
          <button
            onClick={() => handleExport('csv')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            CSV出力
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            Excel出力
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">読み込み中...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>教材が見つかりません</div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-10 px-3 py-3 text-left">
                  <span className="sr-only">選択</span>
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">教材名</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 hidden md:table-cell">提供元</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 hidden md:table-cell">カテゴリ</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 hidden lg:table-cell">タグ</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">評価</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 hidden lg:table-cell">費用</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 hidden xl:table-cell">登録日</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    selected.has(m.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      disabled={!selected.has(m.id) && selected.size >= 10}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      to={`/materials/${m.id}`}
                      className="font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      {m.name}
                    </Link>
                    {m.level && (
                      <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {m.level}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600 hidden md:table-cell">{m.provider}</td>
                  <td className="px-3 py-3 text-slate-600 hidden md:table-cell">{m.category}</td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {m.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                        >
                          {t.name}
                        </span>
                      ))}
                      {m.tags.length > 3 && (
                        <span className="text-xs text-slate-400">+{m.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {m.overall_score !== null && m.overall_score !== undefined ? (
                      <div className="flex items-center gap-1">
                        <StarRating value={Math.round(m.overall_score)} readonly size="sm" />
                        <span className="text-xs text-slate-500">{m.overall_score.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">未評価</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600 hidden lg:table-cell">
                    {m.cost !== null && m.cost !== undefined ? `¥${m.cost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs hidden xl:table-cell">
                    {new Date(m.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/materials/${m.id}/edit`}
                        className="text-xs text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-2 py-1 rounded transition-colors"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-xs text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 px-2 py-1 rounded transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            前へ
          </button>
          <span className="px-4 py-2 text-sm text-slate-600">
            {page + 1} / {Math.ceil(total / LIMIT)}
          </span>
          <button
            disabled={(page + 1) * LIMIT >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            次へ
          </button>
        </div>
      )}
    </Layout>
  );
}
