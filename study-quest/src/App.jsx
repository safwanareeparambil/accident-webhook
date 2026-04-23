import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import HabitList from './components/HabitList';
import Vault from './components/Vault';
import Spinner from './components/Spinner';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'habits',    label: '✅ Habits' },
  { id: 'vault',     label: '🏆 Vault' },
  { id: 'spinner',   label: '🎰 Spinner' },
];

export default function App() {
  const { session } = useAuth();
  const [tab, setTab] = useState('dashboard');

  // Still loading auth state
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top nav */}
      <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-4 px-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'habits'    && <HabitList />}
        {tab === 'vault'     && <Vault />}
        {tab === 'spinner'   && <Spinner />}
      </main>
    </div>
  );
}
