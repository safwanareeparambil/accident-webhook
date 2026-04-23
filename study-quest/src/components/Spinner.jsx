import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// ---------------------------------------------------------------------------
// Consolation facts shown when no reward is hit
// ---------------------------------------------------------------------------
const CONSOLATION_FACTS = [
  'The sum of angles in any triangle is always 180°.',
  'Light travels ~299,792 km per second in a vacuum.',
  'DNA contains about 3 billion base pairs in the human genome.',
  'Pi (π) has been calculated to over 100 trillion digits.',
  'A photon takes ~8 minutes to travel from the Sun to Earth.',
  'Water expands ~9% when it freezes, which is why ice floats.',
  'The Earth\'s core is as hot as the surface of the Sun (~5,500 °C).',
  'There are more possible chess games than atoms in the observable universe.',
  'Neurons fire signals at up to 120 m/s.',
  'The Fibonacci sequence appears in spiral patterns throughout nature.',
];

function randomFact() {
  return CONSOLATION_FACTS[Math.floor(Math.random() * CONSOLATION_FACTS.length)];
}

// ---------------------------------------------------------------------------
// Weighted randomizer: weight_i = 1 / priority_i
// ---------------------------------------------------------------------------
function weightedPick(rewards) {
  if (!rewards.length) return null;
  const weights = rewards.map(r => 1 / r.priority);
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < rewards.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return rewards[i];
  }
  return rewards[rewards.length - 1];
}

// ---------------------------------------------------------------------------
// Wheel visual
// ---------------------------------------------------------------------------
const WHEEL_COLORS = [
  '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
  '#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9',
];

function SpinnerWheel({ segments, rotation }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const count = segments.length || 1;
  const anglePerSeg = (2 * Math.PI) / count;

  function segPath(i) {
    const start = i * anglePerSeg - Math.PI / 2;
    const end = start + anglePerSeg;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = anglePerSeg > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  }

  function segLabel(i) {
    const mid = i * anglePerSeg - Math.PI / 2 + anglePerSeg / 2;
    const lr = r * 0.65;
    return {
      x: cx + lr * Math.cos(mid),
      y: cy + lr * Math.sin(mid),
      angle: (mid * 180) / Math.PI + 90,
    };
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-2xl drop-shadow">
        ▼
      </div>
      <motion.svg
        width={size}
        height={size}
        animate={{ rotate: rotation }}
        transition={{ duration: 4, ease: [0.33, 1, 0.68, 1] }}
        style={{ originX: '50%', originY: '50%' }}
      >
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r + 4} fill="#1e293b" />

        {segments.length === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="#334155" />
        ) : (
          segments.map((seg, i) => (
            <g key={seg.id ?? i}>
              <path
                d={segPath(i)}
                fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                stroke="#0f172a"
                strokeWidth={2}
              />
              {count <= 12 && (
                <text
                  x={segLabel(i).x}
                  y={segLabel(i).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${segLabel(i).angle}, ${segLabel(i).x}, ${segLabel(i).y})`}
                  fontSize={count > 6 ? 9 : 11}
                  fontWeight="600"
                  fill="white"
                  style={{ pointerEvents: 'none' }}
                >
                  {seg.name.length > 12 ? seg.name.slice(0, 11) + '…' : seg.name}
                </text>
              )}
            </g>
          ))
        )}

        {/* Center cap */}
        <circle cx={cx} cy={cy} r={18} fill="#0f172a" stroke="#475569" strokeWidth={2} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={16} fill="#94a3b8">🎯</text>
      </motion.svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Spinner component
// ---------------------------------------------------------------------------
export default function Spinner() {
  const { session } = useAuth();
  const userId = session.user.id;

  const [rewards, setRewards] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null); // { type: 'reward'|'fact', value: string }
  const [rotation, setRotation] = useState(0);
  const prevRotation = useRef(0);

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  async function fetchRewards() {
    const { data } = await supabase
      .from('rewards')
      .select('id, name, priority')
      .eq('user_id', userId);
    if (data) setRewards(data);
  }

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const picked = rewards.length ? weightedPick(rewards) : null;

    // Figure out which segment index was picked so we can land on it
    const segCount = rewards.length || 1;
    let targetIndex = 0;
    if (picked && rewards.length) {
      targetIndex = rewards.findIndex(r => r.id === picked.id);
    }

    const anglePerSeg = 360 / segCount;
    // We want targetIndex segment under the top pointer (12 o'clock = 0°)
    // Wheel starts with segment 0 at the top (offset -90° in SVG, so rotation 0 = seg 0 at top)
    const segCenter = targetIndex * anglePerSeg + anglePerSeg / 2;
    // Extra full rotations for drama (5-8 spins)
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const newRotation = prevRotation.current + extraSpins + (360 - segCenter % 360);
    prevRotation.current = newRotation;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      if (!picked) {
        setResult({ type: 'fact', value: randomFact() });
      } else {
        setResult({ type: 'reward', value: picked.name, priority: picked.priority });
      }
    }, 4200);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🎰 The Spinner</h1>
        <p className="text-slate-400 text-sm mt-1">
          Rare rewards are harder to hit. No reward? You get a consolation fact!
        </p>
      </div>

      {rewards.length === 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl px-4 py-3 text-yellow-300 text-sm">
          ⚠️ Add rewards in The Vault to start spinning!
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        <SpinnerWheel segments={rewards} rotation={rotation} />

        <button
          onClick={spin}
          disabled={spinning || rewards.length === 0}
          className="px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-full shadow-lg transition-colors"
        >
          {spinning ? '🌀 Spinning…' : '🎯 SPIN!'}
        </button>
      </div>

      {/* Result reveal */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl p-6 border text-center ${
            result.type === 'reward'
              ? 'bg-violet-900/40 border-violet-600'
              : 'bg-slate-800 border-slate-600'
          }`}
        >
          {result.type === 'reward' ? (
            <>
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-violet-300 text-sm font-medium mb-1">You won!</p>
              <p className="text-white text-xl font-bold">{result.value}</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🔬</div>
              <p className="text-slate-400 text-sm font-medium mb-1">Consolation Fact</p>
              <p className="text-white text-base italic">"{result.value}"</p>
            </>
          )}
          <button
            onClick={() => setResult(null)}
            className="mt-4 text-slate-400 hover:text-slate-200 text-sm transition-colors"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </div>
  );
}
