import { useEffect, useRef, useState } from 'react';
import CompanionWidget from './CompanionWidget';

const COOLDOWN_MS = 1200;

export default function CompanionLauncher() {
  const [started, setStarted] = useState(false);
  const [cooling, setCooling] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleEnd = () => {
    setStarted(false);
    setCooling(true);
    timerRef.current = setTimeout(() => setCooling(false), COOLDOWN_MS);
  };

  if (started) return <CompanionWidget onEnd={handleEnd} />;

  return (
    <button onClick={() => setStarted(true)} disabled={cooling}>
      {cooling ? 'Ending session…' : 'Need help?'}
    </button>
  );
}