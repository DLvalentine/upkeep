
import { useEffect, useRef, useState } from 'react';
import CompanionWidget from './CompanionWidget';

const COOLDOWN_MS = 1200;

export default function CompanionLauncher({ setSearchQuery, deck, setFilters, setSearchSettings }) {
  const [started, setStarted] = useState(false);
  const [cooling, setCooling] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleEnd = () => {
    setStarted(false);
    setCooling(true);
    timerRef.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  if (started) return <CompanionWidget deck={deck} setSearchQuery={setSearchQuery} setFilters={setFilters} setSearchSettings={setSearchSettings} onEnd={handleEnd} />;

  return (
    <>
      <style>{`
        @keyframes dex-pulse {
          0%, 100% {
            filter:
              drop-shadow(0 0 4px color-mix(in srgb, var(--app-nav) 50%, transparent))
              drop-shadow(0 0 12px color-mix(in srgb, var(--app-nav) 35%, transparent));
          }
          50% {
            filter:
              drop-shadow(0 0 9px color-mix(in srgb, var(--app-nav) 100%, transparent))
              drop-shadow(0 0 22px color-mix(in srgb, var(--app-nav) 75%, transparent));
          }
        }
      `}</style>

      <button
        onClick={() => setStarted(true)}
        disabled={cooling}
        aria-label="Launch Dex"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: cooling ? 'default' : 'pointer',
        }}
      >
        {!cooling && (
          <img
            src={`${import.meta.env.BASE_URL}dex2.png`}
            alt="Dex"
            style={{
              height: '115px',
              width: 'auto',
              borderRadius: 'var(--border-radius)',
              marginBottom: '-8px',
              animation: 'dex-pulse 3.5s ease-in-out infinite',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        )}
      </button>
    </>
  );
}
