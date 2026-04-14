import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { materialsApi, evaluationsApi, memosApi, axesApi } from '../api';
import type { Material, Evaluation, Memo, CustomAxis } from '../types';
import StarRating from '../components/StarRating';
import Layout from '../components/Layout';
import { useAuthStore } from '../store/auth';

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const materialId = Number(id);

  const [material, setMaterial] = useState<Material | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [axes, setAxes] = useState<CustomAxis[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation form
  const [evalForm, setEvalForm] = useState({
    overall_score: 0,
    quality: 0,
    clarity: 0,
    cost_effectiveness: 0,
    custom_scores: {} as Record<string, number>,
  });
  const [evalSaving, setEvalSaving] = useState(false);

  // Memo
  const [newMemo, setNewMemo] = useState('');
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [editingMemoContent, setEditingMemoContent] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);

  const myEval = evaluations.find((e) => e.user_id === user?.id);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mRes, eRes, memoRes, axesRes] = await Promise.all([
          materialsApi.get(materialId),
          evaluationsApi.list(materialId),
          memosApi.list(materialId),
          axesApi.list(),
        ]);
        setMaterial(mRes.data);
        setEvaluations(eRes.data);
        setMemos(memoRes.data);
        setAxes(axesRes.data);

        // Pre-fill eval form
        const myE = eRes.data.find((e) => e.user_id === user?.id);
        if (myE) {
          setEvalForm({
            overall_score: myE.overall_score,
            quality: myE.quality || 0,
            clarity: myE.clarity || 0,
            cost_effectiveness: myE.cost_effectiveness || 0,
            custom_scores: myE.custom_scores || {},
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [materialId, user?.id]);

  const handleDeleteMaterial = async () => {
    if (!confirm('この教材を削除しますか？')) return;
    await materialsApi.delete(materialId);
    navigate('/');
  };

  const handleSaveEval = async () => {
    if (!evalForm.overall_score) return;
    setEvalSaving(true);
    try {
      const payload: any = {
        overall_score: evalForm.overall_score,
        custom_scores: evalForm.custom_scores,
      };
      if (evalForm.quality) payload.quality = evalForm.quality;
      if (evalForm.clarity) payload.clarity = evalForm.clarity;
      if (evalForm.cost_effectiveness) payload.cost_effectiveness = evalForm.cost_effectiveness;
      const res = await evaluationsApi.upsert(materialId, payload);
      setEvaluations((prev) => {
        const existing = prev.findIndex((e) => e.user_id === user?.id);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = res.data;
          return next;
        }
        return [...prev, res.data];
      });
      // Refresh material to update score
      const mRes = await materialsApi.get(materialId);
      setMaterial(mRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setEvalSaving(false);
    }
  };

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;
    setMemoSaving(true);
    try {
      const res = await memosApi.create(materialId, newMemo.trim());
      setMemos((prev) => [res.data, ...prev]);
      setNewMemo('');
    } catch (e) {
      console.error(e);
    } finally {
      setMemoSaving(false);
    }
  };

  const handleUpdateMemo = async (memoId: number) => {
    if (!editingMemoContent.trim()) return;
    try {
      const res = await memosApi.update(materialId, memoId, editingMemoContent.trim());
      setMemos((prev) => prev.map((m) => (m.id === memoId ? res.data : m)));
      setEditingMemoId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!confirm('このメモを削除しますか？')) return;
    await memosApi.delete(materialId, memoId);
    setMemos((prev) => prev.filter((m) => m.id !== memoId));
  };

  const avgScore = (field: keyof Evaluation) => {
    const vals = evaluations.map((e) => e[field] as number).filter(Boolean);
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-slate-400">読み込み中...</div>
      </Layout>
    );
  }

  if (!material) {
    return (
      <Layout>
        <div className="text-center py-16 text-slate-400">教材が見つかりません</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-4">
        <Link to="/" className="hover:text-blue-600">教材一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">{material.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-800 mb-1">{material.name}</h1>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500 mb-3">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">{material.provider}</span>
                  {material.level && (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{material.level}</span>
                  )}
                  {material.language && (
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{material.language}</span>
                  )}
                </div>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm break-all"
                >
                  {material.url}
                </a>
              </div>
              <div className="flex gap-2 ml-4">
                <Link
                  to={`/materials/${materialId}/edit`}
                  className="text-sm border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  編集
                </Link>
                <button
                  onClick={handleDeleteMaterial}
                  className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-400">受講時間</div>
                <div className="font-medium text-slate-700">
                  {material.duration ? `${material.duration}時間` : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">費用</div>
                <div className="font-medium text-slate-700">
                  {material.cost !== undefined && material.cost !== null
                    ? `¥${material.cost.toLocaleString()}`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">登録日</div>
                <div className="font-medium text-slate-700">
                  {new Date(material.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">登録者</div>
                <div className="font-medium text-slate-700">{material.creator_name || '-'}</div>
              </div>
            </div>

            {material.description && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-1">説明・備考</div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{material.description}</p>
              </div>
            )}

            {material.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {material.tags.map((t) => (
                  <span key={t.id} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">評価サマリー</h2>
            {evaluations.length === 0 ? (
              <p className="text-slate-400 text-sm">まだ評価がありません</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-slate-600">総合評価</span>
                  <StarRating value={Math.round(Number(avgScore('overall_score')))} readonly />
                  <span className="text-sm font-medium">{avgScore('overall_score')}</span>
                  <span className="text-xs text-slate-400">({evaluations.length}件)</span>
                </div>
                {['quality', 'clarity', 'cost_effectiveness'].map((field) => {
                  const labels: Record<string, string> = {
                    quality: 'コンテンツの質',
                    clarity: 'わかりやすさ',
                    cost_effectiveness: '費用対効果',
                  };
                  const avg = avgScore(field as keyof Evaluation);
                  if (!avg) return null;
                  return (
                    <div key={field} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600">{labels[field]}</span>
                      <StarRating value={Math.round(Number(avg))} readonly />
                      <span className="text-sm font-medium">{avg}</span>
                    </div>
                  );
                })}
                {axes.map((axis) => {
                  const vals = evaluations
                    .map((e) => e.custom_scores?.[String(axis.id)])
                    .filter((v): v is number => v !== undefined);
                  if (!vals.length) return null;
                  const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
                  return (
                    <div key={axis.id} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-slate-600">{axis.name}</span>
                      <StarRating value={Math.round(Number(avg))} readonly />
                      <span className="text-sm font-medium">{avg}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Memos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">メモ</h2>

            {/* Add memo */}
            <div className="mb-4">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                rows={3}
                placeholder="メモを入力..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddMemo}
                  disabled={!newMemo.trim() || memoSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  {memoSaving ? '保存中...' : '追加'}
                </button>
              </div>
            </div>

            {/* Memo list */}
            <div className="space-y-3">
              {memos.length === 0 && (
                <p className="text-slate-400 text-sm">メモはありません</p>
              )}
              {memos.map((memo) => (
                <div key={memo.id} className="border border-slate-100 rounded-lg p-3">
                  {editingMemoId === memo.id ? (
                    <div>
                      <textarea
                        value={editingMemoContent}
                        onChange={(e) => setEditingMemoContent(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingMemoId(null)}
                          className="text-sm text-slate-500 hover:text-slate-700"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleUpdateMemo(memo.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap">{memo.content}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-400">
                          {memo.user_name} ·{' '}
                          {new Date(memo.created_at).toLocaleString('ja-JP')}
                          {memo.updated_at !== memo.created_at && ' (編集済み)'}
                        </div>
                        {memo.user_id === user?.id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingMemoId(memo.id);
                                setEditingMemoContent(memo.content);
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteMemo(memo.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: My evaluation */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              自分の評価
              {myEval && (
                <span className="ml-2 text-xs text-green-600 font-normal">評価済み</span>
              )}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  総合評価 <span className="text-red-500">*</span>
                </label>
                <StarRating
                  value={evalForm.overall_score}
                  onChange={(v) => setEvalForm((f) => ({ ...f, overall_score: v }))}
                  size="lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">コンテンツの質</label>
                <StarRating
                  value={evalForm.quality}
                  onChange={(v) => setEvalForm((f) => ({ ...f, quality: v }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">わかりやすさ</label>
                <StarRating
                  value={evalForm.clarity}
                  onChange={(v) => setEvalForm((f) => ({ ...f, clarity: v }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">費用対効果</label>
                <StarRating
                  value={evalForm.cost_effectiveness}
                  onChange={(v) => setEvalForm((f) => ({ ...f, cost_effectiveness: v }))}
                />
              </div>

              {axes.map((axis) => (
                <div key={axis.id}>
                  <label className="text-sm font-medium text-slate-700 block mb-1">{axis.name}</label>
                  <StarRating
                    value={evalForm.custom_scores[String(axis.id)] || 0}
                    onChange={(v) =>
                      setEvalForm((f) => ({
                        ...f,
                        custom_scores: { ...f.custom_scores, [String(axis.id)]: v },
                      }))
                    }
                  />
                </div>
              ))}

              <button
                onClick={handleSaveEval}
                disabled={!evalForm.overall_score || evalSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {evalSaving ? '保存中...' : myEval ? '評価を更新' : '評価を登録'}
              </button>
            </div>
          </div>

          {/* Other evaluations */}
          {evaluations.filter((e) => e.user_id !== user?.id).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-base font-semibold text-slate-800 mb-3">他のメンバーの評価</h2>
              <div className="space-y-3">
                {evaluations
                  .filter((e) => e.user_id !== user?.id)
                  .map((e) => (
                    <div key={e.id} className="border-b border-slate-100 pb-3 last:border-0">
                      <div className="text-xs text-slate-400 mb-1">{e.user_name}</div>
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(e.overall_score)} readonly size="sm" />
                        <span className="text-sm">{e.overall_score.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
