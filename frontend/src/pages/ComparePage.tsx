import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { materialsApi, axesApi, exportApi } from '../api';
import type { Material, CustomAxis } from '../types';
import StarRating from '../components/StarRating';
import Layout from '../components/Layout';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').map(Number).filter(Boolean) || [];

  const [materials, setMaterials] = useState<Material[]>([]);
  const [_axes, setAxes] = useState<CustomAxis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mResults, axesRes] = await Promise.all([
          Promise.all(ids.map((id) => materialsApi.get(id))),
          axesApi.list(),
        ]);
        setMaterials(mResults.map((r) => r.data));
        setAxes(axesRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (ids.length > 0) load();
  }, [searchParams]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const params = { material_ids: ids.join(',') };
    try {
      const fn = format === 'csv' ? exportApi.downloadCsv : exportApi.downloadXlsx;
      const res = await fn(params);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `tmcms_compare_${now}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-slate-400">読み込み中...</div>
      </Layout>
    );
  }

  if (materials.length === 0) {
    return (
      <Layout>
        <div className="text-center py-16 text-slate-400">比較対象が選択されていません</div>
      </Layout>
    );
  }

  const rows = [
    { label: '教材名', render: (m: Material) => (
      <Link to={`/materials/${m.id}`} className="font-medium text-blue-700 hover:underline">
        {m.name}
      </Link>
    )},
    { label: '提供元', render: (m: Material) => m.provider },
    { label: 'カテゴリ', render: (m: Material) => m.category },
    { label: '対象レベル', render: (m: Material) => m.level || '-' },
    { label: '言語', render: (m: Material) => m.language || '-' },
    { label: '受講時間', render: (m: Material) => m.duration ? `${m.duration}時間` : '-' },
    { label: '費用', render: (m: Material) => m.cost != null ? `¥${m.cost.toLocaleString()}` : '-' },
    { label: 'タグ', render: (m: Material) => (
      <div className="flex flex-wrap gap-1">
        {m.tags.length > 0
          ? m.tags.map((t) => (
              <span key={t.id} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                {t.name}
              </span>
            ))
          : '-'}
      </div>
    )},
    { label: '総合評価', render: (m: Material) =>
      m.overall_score != null ? (
        <div className="flex items-center gap-1">
          <StarRating value={Math.round(m.overall_score)} readonly size="sm" />
          <span className="text-sm">{m.overall_score.toFixed(1)}</span>
        </div>
      ) : '未評価'
    },
    { label: '評価件数', render: (m: Material) => `${m.evaluation_count}件` },
    { label: 'URL', render: (m: Material) => (
      <a href={m.url} target="_blank" rel="noopener noreferrer"
        className="text-blue-600 hover:underline text-xs break-all">
        リンク
      </a>
    )},
    { label: '登録日', render: (m: Material) => new Date(m.created_at).toLocaleDateString('ja-JP') },
    { label: '登録者', render: (m: Material) => m.creator_name || '-' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-slate-500 mb-1">
            <Link to="/" className="hover:text-blue-600">教材一覧</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-800">比較</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">教材比較</h1>
        </div>
        <div className="flex gap-2">
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left font-semibold text-slate-700 w-36 sticky left-0 bg-slate-50">
                項目
              </th>
              {materials.map((m) => (
                <th key={m.id} className="px-4 py-3 text-left font-semibold text-slate-700 min-w-48">
                  <Link to={`/materials/${m.id}`} className="text-blue-700 hover:underline">
                    {m.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                <td className="px-4 py-3 font-medium text-slate-600 sticky left-0 bg-inherit">
                  {row.label}
                </td>
                {materials.map((m) => (
                  <td key={m.id} className="px-4 py-3 text-slate-700">
                    {row.render(m)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-slate-500">
        <Link to="/" className="text-blue-600 hover:underline">← 教材一覧に戻る</Link>
      </div>
    </Layout>
  );
}
