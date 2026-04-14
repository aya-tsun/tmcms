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
        <div className="text-center py-16 text-purple-300">読み込み中...</div>
      </Layout>
    );
  }

  if (!material) {
    return (
      <Layout>
        <div className="text-center py-16 text-purple-300">教材が見つかりません</div>
      </Layout>
    );
  }

  const cardClass = "bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm p-6";

  return (
    <Layout>
      {/* Breadcrumb */}
      <nav className="text-sm text-purple-400 mb-5">
        <Link to="/" className="hover:text-violet-600 transition-colors">教材一覧</Link>
        <span className="mx-2">/</span>
        <span style={{ color: '#4c1d95' }}>{material.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className={cardClass}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2" style={{ color: '#2e1065' }}>{material.name}</h1>
                <div className="flex flex-wrap gap-2 text-sm mb-3">
                  <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full border border-purple-100 text-xs font-medium">{material.provider}</span>
                  {material.level && (
                    <span className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full border border-violet-100 text-xs font-medium">{material.level}</span>
                  )}
                  {material.language && (
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 text-xs font-medium">{material.language}</span>
                  )}
                </div>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-500 hover:text-violet-700 hover:underline text-sm break-all transition-colors"
                >
                  {material.url}
                </a>
              </div>
              <div className="flex gap-2 ml-4">
                <Link
                  to={`/materials/${materialId}/edit`}
                  className="text-sm border-2 border-purple-200 text-purple-600 px-3 py-1.5 rounded-xl hover:bg-purple-50 hover:border-violet-400 transition-all"
                >
                  編集
                </Link>
                <button
                  onClick={handleDeleteMaterial}
                  className="text-sm border-2 border-red-100 text-red-400 px-3 py-1.5 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all"
                >
                  削除
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-purple-50">
              <div>
                <div className="text-xs text-purple-400 font-medium mb-0.5">受講時間</div>
                <div className="font-semibold text-slate-700">
                  {material.duration ? `${material.duration}時間` : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-400 font-medium mb-0.5">費用</div>
                <div className="font-semibold text-slate-700">
                  {material.cost !== undefined && material.cost !== null
                    ? `¥${material.cost.toLocaleString()}`
                    : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-400 font-medium mb-0.5">登録日</div>
                <div className="font-semibold text-slate-700">
                  {new Date(material.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
              <div>
                <div className="text-xs text-purple-400 font-medium mb-0.5">登録者</div>
                <div className="font-semibold text-slate-700">{material.creator_name || '-'}</div>
              </div>
            </div>

            {material.description && (
              <div className="mt-4 pt-4 border-t border-purple-50">
                <div className="text-xs text-purple-400 font-medium mb-1.5">説明・備考</div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{material.description}</p>
              </div>
            )}

            {material.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {material.tags.map((t) => (
                  <span key={t.id} className="bg-violet-50 text-violet-600 text-xs px-3 py-1 rounded-full border border-violet-100 font-medium">
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation summary */}
          <div className={cardClass}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#4c1d95' }}>評価サマリー</h2>
            {evaluations.length === 0 ? (
              <p className="text-purple-300 text-sm">まだ評価がありません</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-32 text-sm text-purple-600 font-medium">総合評価</span>
                  <StarRating value={Math.round(Number(avgScore('overall_score')))} readonly />
                  <span className="text-sm font-semibold text-slate-700">{avgScore('overall_score')}</span>
                  <span className="text-xs text-purple-300">({evaluations.length}件)</span>
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
                      <span className="w-32 text-sm text-purple-600 font-medium">{labels[field]}</span>
                      <StarRating value={Math.round(Number(avg))} readonly />
                      <span className="text-sm font-semibold text-slate-700">{avg}</span>
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
                      <span className="w-32 text-sm text-purple-600 font-medium">{axis.name}</span>
                      <StarRating value={Math.round(Number(avg))} readonly />
                      <span className="text-sm font-semibold text-slate-700">{avg}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Memos */}
          <div className={cardClass}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#4c1d95' }}>メモ</h2>

            <div className="mb-4">
              <textarea
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                rows={3}
                placeholder="メモを入力..."
                className="w-full border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-purple-50/30 resize-none transition-all"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddMemo}
                  disabled={!newMemo.trim() || memoSaving}
                  className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                >
                  {memoSaving ? '保存中...' : '追加'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {memos.length === 0 && (
                <p className="text-purple-300 text-sm">メモはありません</p>
              )}
              {memos.map((memo) => (
                <div key={memo.id} className="border-2 border-purple-50 rounded-xl p-4 bg-purple-50/20">
                  {editingMemoId === memo.id ? (
                    <div>
                      <textarea
                        value={editingMemoContent}
                        onChange={(e) => setEditingMemoContent(e.target.value)}
                        rows={3}
                        className="w-full border-2 border-purple-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 bg-white resize-none transition-all"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingMemoId(null)}
                          className="text-sm text-purple-400 hover:text-purple-600 transition-colors"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => handleUpdateMemo(memo.id)}
                          className="text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-all shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{memo.content}</div>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="text-xs text-purple-300">
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
                              className="text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors"
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteMemo(memo.id)}
                              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
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
        <div className="space-y-5">
          <div className={`${cardClass} sticky top-6`}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#4c1d95' }}>
              自分の評価
              {myEval && (
                <span className="ml-2 text-xs text-emerald-500 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">評価済み</span>
              )}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-purple-700 block mb-1.5">
                  総合評価 <span className="text-red-400">*</span>
                </label>
                <StarRating
                  value={evalForm.overall_score}
                  onChange={(v) => setEvalForm((f) => ({ ...f, overall_score: v }))}
                  size="lg"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-purple-700 block mb-1.5">コンテンツの質</label>
                <StarRating
                  value={evalForm.quality}
                  onChange={(v) => setEvalForm((f) => ({ ...f, quality: v }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-purple-700 block mb-1.5">わかりやすさ</label>
                <StarRating
                  value={evalForm.clarity}
                  onChange={(v) => setEvalForm((f) => ({ ...f, clarity: v }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-purple-700 block mb-1.5">費用対効果</label>
                <StarRating
                  value={evalForm.cost_effectiveness}
                  onChange={(v) => setEvalForm((f) => ({ ...f, cost_effectiveness: v }))}
                />
              </div>

              {axes.map((axis) => (
                <div key={axis.id}>
                  <label className="text-sm font-semibold text-purple-700 block mb-1.5">{axis.name}</label>
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
                className="w-full text-white py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-60 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
              >
                {evalSaving ? '保存中...' : myEval ? '評価を更新' : '評価を登録'}
              </button>
            </div>
          </div>

          {/* Other evaluations */}
          {evaluations.filter((e) => e.user_id !== user?.id).length > 0 && (
            <div className={cardClass}>
              <h2 className="text-base font-bold mb-3" style={{ color: '#4c1d95' }}>他のメンバーの評価</h2>
              <div className="space-y-3">
                {evaluations
                  .filter((e) => e.user_id !== user?.id)
                  .map((e) => (
                    <div key={e.id} className="border-b border-purple-50 pb-3 last:border-0">
                      <div className="text-xs text-purple-300 mb-1 font-medium">{e.user_name}</div>
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(e.overall_score)} readonly size="sm" />
                        <span className="text-sm font-semibold text-slate-600">{e.overall_score.toFixed(1)}</span>
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
