import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Vault() {
  const { session } = useAuth();
  const userId = session.user.id;

  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState({ name: '', priority: 5 });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  async function fetchRewards() {
    const { data } = await supabase
      .from('rewards')
      .select('id, name, priority')
      .eq('user_id', userId)
      .order('priority', { ascending: true });
    if (data) setRewards(data);
  }

  async function saveReward(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase
        .from('rewards')
        .update({ name: form.name.trim(), priority: Number(form.priority) })
        .eq('id', editId);
      setEditId(null);
    } else {
      await supabase.from('rewards').insert({
        user_id: userId,
        name: form.name.trim(),
        priority: Number(form.priority),
      });
    }
    setForm({ name: '', priority: 5 });
    await fetchRewards();
    setSaving(false);
  }

  async function deleteReward(id) {
    await supabase.from('rewards').delete().eq('id', id);
    setRewards(prev => prev.filter(r => r.id !== id));
  }

  function startEdit(reward) {
    setEditId(reward.id);
    setForm({ name: reward.name, priority: reward.priority });
  }

  function cancelEdit() {
    setEditId(null);
    setForm({ name: '', priority: 5 });
  }

  function rarityLabel(p) {
    if (p <= 2) return { label: 'Common', color: 'text-slate-400' };
    if (p <= 4) return { label: 'Uncommon', color: 'text-green-400' };
    if (p <= 6) return { label: 'Rare', color: 'text-blue-400' };
    if (p <= 8) return { label: 'Epic', color: 'text-violet-400' };
    return { label: 'Legendary', color: 'text-yellow-400' };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🏆 The Vault</h1>
        <p className="text-slate-400 text-sm mt-1">
          Lower priority = more common in the spinner. Higher = rare surprise!
        </p>
      </div>

      {/* Priority legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {[
          { range: '1-2', label: 'Common', color: 'text-slate-400 bg-slate-700' },
          { range: '3-4', label: 'Uncommon', color: 'text-green-400 bg-green-900/30' },
          { range: '5-6', label: 'Rare', color: 'text-blue-400 bg-blue-900/30' },
          { range: '7-8', label: 'Epic', color: 'text-violet-400 bg-violet-900/30' },
          { range: '9-10', label: 'Legendary', color: 'text-yellow-400 bg-yellow-900/30' },
        ].map(r => (
          <span key={r.label} className={`px-2 py-1 rounded-full font-medium ${r.color}`}>
            P{r.range} · {r.label}
          </span>
        ))}
      </div>

      {/* Reward list */}
      <ul className="space-y-2">
        {rewards.map(reward => {
          const { label, color } = rarityLabel(reward.priority);
          return (
            <li
              key={reward.id}
              className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300">
                {reward.priority}
              </div>
              <span className="flex-1 text-slate-200 text-sm">{reward.name}</span>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
              <button
                onClick={() => startEdit(reward)}
                className="text-slate-400 hover:text-violet-400 text-sm transition-colors ml-1"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteReward(reward.id)}
                className="text-slate-400 hover:text-red-400 text-sm transition-colors"
              >
                🗑️
              </button>
            </li>
          );
        })}
        {rewards.length === 0 && (
          <li className="text-slate-500 text-center py-8">No rewards yet. Add some below!</li>
        )}
      </ul>

      {/* Add / Edit form */}
      <form onSubmit={saveReward} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-medium">{editId ? '✏️ Edit Reward' : '+ New Reward'}</h3>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Reward name (e.g. 30 min gaming)"
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
        />
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <label className="text-slate-300">Priority</label>
            <span className={`font-semibold ${rarityLabel(form.priority).color}`}>
              {form.priority} · {rarityLabel(form.priority).label}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>1 (Common)</span>
            <span>10 (Legendary)</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : editId ? 'Update' : 'Add Reward'}
          </button>
          {editId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
