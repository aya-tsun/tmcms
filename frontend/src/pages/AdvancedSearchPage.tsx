import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { materialsApi, tagsApi, learningTopicsApi } from '../api';
import type { Material, Tag, LearningTopic, MaterialFilters } from '../types';
import StarRating from '../components/StarRating';
import Layout from '../components/Layout';

const PROVIDERS = ['Udemy', 'Coursera', 'LinkedIn Learning', 'Pluralsight', 'YouTube'];
const PROVIDER_CATEGORIES = ['企業・教育事業会社', '教育機関', '外部プラットフォーム', '自社', '個人・コミュニティ', 'その他'];
const LEVELS = ['入門', '初級', '中級', '上級'];
const LANGUAGES = ['日本語', '英語', 'その他'];
const DELIVERY_METHODS = ['eラーニング', '書籍', '動画（録画）', 'ハンズオン', '集合研修', 'YouTube・SNS', 'ブログ・記事', '資格試験'];

const inputClass = "border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 rounded-2xl border border-purple-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-purple-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ChipToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium ${
        active ? 'bg-violet-500 text-white border-violet-500 shadow-sm' : 'bg-white text-violet-600 border-violet-200 hover:border-violet-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function AdvancedSearchPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTopics, setAllTopics] = useState<LearningTopic[]>([]);
  const [results, setResults] = useState<Material[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [search, setSearch] = useState('');
  const [memoSearch, setMemoSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [providerCategory, setProviderCategory] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [durationMin, setDurationMin] = useState('');
  const [durationMax, setDurationMax] = useState('');
  const [costMin, setCostMin] = useState('');
  const [costMax, setCostMax] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [scoreMax, setScoreMax] = useState('');

  useEffect(() => {
    tagsApi.list().then((r) => setTags(r.data));
    learningTopicsApi.list().then((r) => setAllTopics(r.data));
  }, []);

  const toggle = <T,>(arr: T[], val: T, set: (v: T[]) => void) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params: MaterialFilters & { limit: number } = { limit: 200 };
      if (search) params.search = search;
      if (memoSearch) params.memo_search = memoSearch;
      if (provider) params.provider = provider;
      if (providerCategory) params.provider_category = providerCategory;
      if (selectedLevels.length === 1) params.level = selectedLevels[0];
      if (selectedLanguages.length === 1) params.language = selectedLanguages[0];
      if (selectedDelivery.length > 0) params.delivery_method = selectedDelivery[0];
      if (selectedTopicIds.length > 0) params.learning_topic_ids = selectedTopicIds.join(',');
      if (selectedTagIds.length > 0) params.tag_ids = selectedTagIds.join(',');
      if (durationMin) params.duration_min = parseFloat(durationMin);
      if (durationMax) params.duration_max = parseFloat(durationMax);
      if (costMin) params.cost_min = parseFloat(costMin);
      if (costMax) params.cost_max = parseFloat(costMax);
      if (scoreMin) params.score_min = parseFloat(scoreMin);
      if (scoreMax) params.score_max = parseFloat(scoreMax);

      // 複数レベル・言語は OR 条件でクライアント側フィルタ
      const res = await materialsApi.list(params);
      let items = res.data.items;
      if (selectedLevels.length > 1) items = items.filter((m) => m.level && selectedLevels.includes(m.level));
      if (selectedLanguages.length > 1) items = items.filter((m) => m.language && selectedLanguages.includes(m.language));
      if (selectedDelivery.length > 1) {
        items = items.filter((m) => m.delivery_methods && selectedDelivery.every((d) => m.delivery_methods!.includes(d)));
      }

      setResults(items);
      setTotal(items.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch(''); setMemoSearch(''); setProvider(''); setProviderCategory('');
    setSelectedLevels([]); setSelectedLanguages([]); setSelectedDelivery([]);
    setSelectedTopicIds([]); setSelectedTagIds([]);
    setDurationMin(''); setDurationMax(''); setCostMin(''); setCostMax('');
    setScoreMin(''); setScoreMax('');
    setResults(null); setSearched(false);
  };

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#4c1d95' }}>詳細検索</h1>
        <p className="text-sm text-purple-400 mt-1">複数の条件を組み合わせて教材を絞り込めます（AND条件）</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

        {/* キーワード */}
        <SectionCard title="キーワード">
          <div className="space-y-2">
            <input type="text" placeholder="教材名・提供元" value={search}
              onChange={(e) => setSearch(e.target.value)} className={inputClass} />
            <input type="text" placeholder="メモ内容で検索" value={memoSearch}
              onChange={(e) => setMemoSearch(e.target.value)} className={inputClass} />
          </div>
        </SectionCard>

        {/* 提供元 */}
        <SectionCard title="提供元">
          <div className="space-y-2">
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass}>
              <option value="">すべて</option>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={providerCategory} onChange={(e) => setProviderCategory(e.target.value)} className={inputClass}>
              <option value="">分類: すべて</option>
              {PROVIDER_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </SectionCard>

        {/* レベル・言語 */}
        <SectionCard title="レベル・言語">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-purple-400 mb-1.5">レベル</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <ChipToggle key={l} label={l} active={selectedLevels.includes(l)}
                    onClick={() => toggle(selectedLevels, l, setSelectedLevels)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-purple-400 mb-1.5">言語</p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <ChipToggle key={l} label={l} active={selectedLanguages.includes(l)}
                    onClick={() => toggle(selectedLanguages, l, setSelectedLanguages)} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 提供方法 */}
        <SectionCard title="提供方法（AND条件）">
          <div className="flex flex-wrap gap-2">
            {DELIVERY_METHODS.map((d) => (
              <ChipToggle key={d} label={d} active={selectedDelivery.includes(d)}
                onClick={() => toggle(selectedDelivery, d, setSelectedDelivery)} />
            ))}
          </div>
        </SectionCard>

        {/* 学習項目 */}
        {allTopics.length > 0 && (
          <SectionCard title="学習項目（AND条件）">
            <div className="flex flex-wrap gap-2">
              {allTopics.map((t) => (
                <ChipToggle key={t.id} label={t.name} active={selectedTopicIds.includes(t.id)}
                  onClick={() => toggle(selectedTopicIds, t.id, setSelectedTopicIds)} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* タグ */}
        {tags.length > 0 && (
          <SectionCard title="タグ（AND条件）">
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <ChipToggle key={t.id} label={t.name} active={selectedTagIds.includes(t.id)}
                  onClick={() => toggle(selectedTagIds, t.id, setSelectedTagIds)} />
              ))}
            </div>
          </SectionCard>
        )}

        {/* 数値範囲 */}
        <SectionCard title="受講時間・費用・評価">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-purple-400 mb-1.5">受講時間（時間）</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="下限" value={durationMin} min={0}
                  onChange={(e) => setDurationMin(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
                <span className="text-purple-300 shrink-0">〜</span>
                <input type="number" placeholder="上限" value={durationMax} min={0}
                  onChange={(e) => setDurationMax(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
              </div>
            </div>
            <div>
              <p className="text-xs text-purple-400 mb-1.5">費用（円）</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="下限" value={costMin} min={0}
                  onChange={(e) => setCostMin(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
                <span className="text-purple-300 shrink-0">〜</span>
                <input type="number" placeholder="上限" value={costMax} min={0}
                  onChange={(e) => setCostMax(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
              </div>
            </div>
            <div>
              <p className="text-xs text-purple-400 mb-1.5">総合評価（1〜5）</p>
              <div className="flex items-center gap-2">
                <input type="number" placeholder="下限" value={scoreMin} min={1} max={5} step={0.1}
                  onChange={(e) => setScoreMin(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
                <span className="text-purple-300 shrink-0">〜</span>
                <input type="number" placeholder="上限" value={scoreMax} min={1} max={5} step={0.1}
                  onChange={(e) => setScoreMax(e.target.value)}
                  className="border-2 border-purple-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white w-full" />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* 操作ボタン */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleSearch}
          disabled={loading}
          className="text-white px-8 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
        >
          {loading ? '検索中...' : '検索する'}
        </button>
        <button
          onClick={handleReset}
          className="border-2 border-purple-200 text-purple-600 px-6 py-2.5 rounded-2xl text-sm font-medium hover:bg-purple-50 transition-all"
        >
          リセット
        </button>
      </div>

      {/* 検索結果 */}
      {searched && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-purple-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-700">
              検索結果
              {!loading && <span className="ml-2 text-purple-400 font-normal">{total} 件</span>}
            </span>
          </div>
          {loading ? (
            <div className="text-center py-12 text-purple-300">検索中...</div>
          ) : results && results.length === 0 ? (
            <div className="text-center py-12 text-purple-300">
              <div className="text-3xl mb-2">🔍</div>
              <div>条件に一致する教材が見つかりませんでした</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-purple-100" style={{ backgroundColor: '#faf5ff' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-purple-700">教材名</th>
                  <th className="px-4 py-3 text-left font-semibold text-purple-700">提供元</th>
                  <th className="px-4 py-3 text-left font-semibold text-purple-700">学習項目</th>
                  <th className="px-4 py-3 text-left font-semibold text-purple-700 w-28">評価</th>
                  <th className="px-4 py-3 text-left font-semibold text-purple-700">費用</th>
                  <th className="px-4 py-3 text-right font-semibold text-purple-700">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {results!.map((m) => (
                  <tr key={m.id} className="hover:bg-violet-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/materials/${m.id}`} className="font-semibold text-violet-700 hover:underline">
                        {m.name}
                      </Link>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.level && <span className="text-xs bg-violet-50 text-violet-500 px-2 py-0.5 rounded-full border border-violet-100">{m.level}</span>}
                        {m.language && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">{m.language}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700">{m.provider}</span>
                      {m.provider_category && <div className="text-xs text-amber-500 mt-0.5">{m.provider_category}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.learning_topics.length > 0
                          ? m.learning_topics.map((t) => (
                              <span key={t.id} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">{t.name}</span>
                            ))
                          : <span className="text-xs text-purple-200">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.overall_score != null ? (
                        <div className="flex items-center gap-1">
                          <StarRating value={Math.round(m.overall_score)} readonly size="sm" />
                          <span className="text-xs text-slate-500">{m.overall_score.toFixed(1)}</span>
                        </div>
                      ) : <span className="text-xs text-purple-300">未評価</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {m.cost != null ? `¥${m.cost.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/materials/${m.id}`}
                        className="text-xs text-violet-600 hover:text-violet-800 border border-violet-200 hover:border-violet-400 hover:bg-violet-50 px-2.5 py-1 rounded-lg transition-all">
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Layout>
  );
}
