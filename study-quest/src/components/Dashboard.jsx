import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function weeklyHoursGoal() {
  return 20; // default weekly goal
}

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const userId = session.user.id;

  const [profile, setProfile] = useState({ exam_name: '', exam_date: '' });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ exam_name: '', exam_date: '' });
  const [weekHours, setWeekHours] = useState(0);
  const [logHours, setLogHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [logSaving, setLogSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchWeekHours();
  }, [userId]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('exam_name, exam_date')
      .eq('user_id', userId)
      .single();
    if (data) {
      setProfile(data);
      setForm(data);
    }
  }

  async function fetchWeekHours() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from('study_logs')
      .select('hours')
      .eq('user_id', userId)
      .gte('logged_at', weekAgo.toISOString());
    if (data) {
      const total = data.reduce((s, r) => s + Number(r.hours), 0);
      setWeekHours(total);
    }
  }

  async function saveProfile() {
    setSaving(true);
    await supabase.from('profiles').upsert(
      { user_id: userId, exam_name: form.exam_name, exam_date: form.exam_date || null },
      { onConflict: 'user_id' }
    );
    await fetchProfile();
    setEditing(false);
    setSaving(false);
  }

  async function logStudyHours(e) {
    e.preventDefault();
    if (!logHours || Number(logHours) <= 0) return;
    setLogSaving(true);
    await supabase.from('study_logs').insert({
      user_id: userId,
      hours: Number(logHours),
      logged_at: new Date().toISOString(),
    });
    setLogHours('');
    await fetchWeekHours();
    setLogSaving(false);
  }

  const days = daysUntil(profile.exam_date);
  const goal = weeklyHoursGoal();
  const progressPct = Math.min((weekHours / goal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Dashboard</h1>
          <p className="text-slate-400 text-sm">{session.user.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-slate-400 hover:text-white text-sm border border-slate-600 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Exam Countdown */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">🗓️ Exam Countdown</h2>
          <button
            onClick={() => { setEditing(e => !e); setForm(profile); }}
            className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Exam name (e.g. JEE Advanced)"
              value={form.exam_name}
              onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
            />
            <input
              type="date"
              value={form.exam_date}
              onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            {profile.exam_name ? (
              <>
                <p className="text-slate-300 mb-2">{profile.exam_name}</p>
                {days !== null ? (
                  <div>
                    <span className={`text-5xl font-bold ${days <= 7 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-violet-400'}`}>
                      {days}
                    </span>
                    <span className="text-slate-400 ml-2">days to go</span>
                  </div>
                ) : (
                  <p className="text-slate-400">No date set</p>
                )}
              </>
            ) : (
              <p className="text-slate-400">Click Edit to set your exam details</p>
            )}
          </div>
        )}
      </div>

      {/* Weekly Study Progress */}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">⏱️ Weekly Study Hours</h2>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-slate-300 text-sm font-medium w-24 text-right">
            {weekHours.toFixed(1)} / {goal} hrs
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          {progressPct >= 100
            ? '🎉 Weekly goal smashed!'
            : `${(goal - weekHours).toFixed(1)} hours to hit your weekly goal`}
        </p>

        <form onSubmit={logStudyHours} className="flex gap-2">
          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={logHours}
            onChange={e => setLogHours(e.target.value)}
            placeholder="Hours studied"
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={logSaving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {logSaving ? 'Logging…' : '+ Log'}
          </button>
        </form>
      </div>
    </div>
  );
}
