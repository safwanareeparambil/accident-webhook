import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function HabitList() {
  const { session } = useAuth();
  const userId = session.user.id;

  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, [userId]);

  async function fetchHabits() {
    const today = todayKey();
    const { data } = await supabase
      .from('habits')
      .select('id, name, completed_date')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data) {
      // Mark completed only if completed_date matches today
      setHabits(data.map(h => ({ ...h, done: h.completed_date === today })));
    }
  }

  async function addHabit(e) {
    e.preventDefault();
    if (!newHabit.trim()) return;
    setAdding(true);
    await supabase.from('habits').insert({
      user_id: userId,
      name: newHabit.trim(),
      completed_date: null,
    });
    setNewHabit('');
    await fetchHabits();
    setAdding(false);
  }

  async function toggleHabit(habit) {
    const today = todayKey();
    const newDate = habit.done ? null : today;
    await supabase
      .from('habits')
      .update({ completed_date: newDate })
      .eq('id', habit.id);
    setHabits(prev =>
      prev.map(h => h.id === habit.id ? { ...h, done: !h.done, completed_date: newDate } : h)
    );
  }

  async function deleteHabit(id) {
    await supabase.from('habits').delete().eq('id', id);
    setHabits(prev => prev.filter(h => h.id !== id));
  }

  const completed = habits.filter(h => h.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">✅ Daily Habits</h1>
        <p className="text-slate-400 text-sm mt-1">Resets each day automatically</p>
      </div>

      {habits.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-slate-700 rounded-full h-2">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${(completed / habits.length) * 100}%` }}
            />
          </div>
          <span className="text-slate-400 text-sm">{completed}/{habits.length}</span>
        </div>
      )}

      <ul className="space-y-2">
        {habits.map(habit => (
          <li
            key={habit.id}
            className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 group"
          >
            <button
              onClick={() => toggleHabit(habit)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                habit.done
                  ? 'bg-green-500 border-green-500'
                  : 'border-slate-500 hover:border-green-400'
              }`}
            >
              {habit.done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-sm ${habit.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {habit.name}
            </span>
            <button
              onClick={() => deleteHabit(habit.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-lg leading-none"
            >
              ×
            </button>
          </li>
        ))}
        {habits.length === 0 && (
          <li className="text-slate-500 text-center py-8">No habits yet. Add one below!</li>
        )}
      </ul>

      <form onSubmit={addHabit} className="flex gap-2">
        <input
          type="text"
          value={newHabit}
          onChange={e => setNewHabit(e.target.value)}
          placeholder="New habit (e.g. Review flashcards)"
          className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {adding ? '…' : '+ Add'}
        </button>
      </form>
    </div>
  );
}
