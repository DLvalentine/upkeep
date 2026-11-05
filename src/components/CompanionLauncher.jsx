
import { useEffect, useRef, useState } from 'react';
import CompanionWidget from './CompanionWidget';

const COOLDOWN_MS = 1200;
const PORTAL_TRANSITION_MS = 675;

export default function CompanionLauncher({ setSearchQuery, deck, setFilters, setSearchSettings }) {
  const [started, setStarted] = useState(false);
  const [cooling, setCooling] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [returning, setReturning] = useState(false);
  const timerRef = useRef(null);
  const launchTimerRef = useRef(null);
  const returnTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(launchTimerRef.current);
    clearTimeout(returnTimerRef.current);
  }, []);

  const handleEnd = () => {
    setStarted(false);
    setReturning(true);
    setCooling(true);
    returnTimerRef.current = setTimeout(() => setReturning(false), PORTAL_TRANSITION_MS);
    timerRef.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  const handleLaunch = () => {
    if (cooling || launching) return;

    setLaunching(true);
    launchTimerRef.current = setTimeout(() => {
      launchTimerRef.current = null;
      setLaunching(false);
      setStarted(true);
    }, PORTAL_TRANSITION_MS);
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

      <div className="companion-launcher">
        {(launching || returning) && (
          <div className={`companion-portal companion-portal--launcher${returning ? ' companion-portal--reverse' : ''}`} aria-hidden="true">
            <div className="companion-portal__core" />
            <div className="companion-portal__ring companion-portal__ring--outer" />
            <div className="companion-portal__ring companion-portal__ring--inner" />
            <div className="companion-portal__sparks" />
          </div>
        )}
        <button
          className="companion-launcher__button"
          onClick={handleLaunch}
          disabled={cooling || launching}
          aria-label="Launch Dex"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: cooling || launching ? 'default' : 'pointer',
          }}
        >
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
        </button>
      </div>
    </>
  );
}
