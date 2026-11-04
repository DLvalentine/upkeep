// Libs
import { MoonLoader } from 'react-spinners';

// Components
import Logo from './Logo';

export default function LoadingScreen({ error, onRetry }) {
    return (
        <main
            className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center"
            aria-live="polite"
        >
            {error ? (
                <>
                    <h1 className="text-2xl font-semibold">
                        Unable to load data
                    </h1>
                    <p className="max-w-md text-[var(--text-secondary)]">
                        Check your connection and try again.
                    </p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-md bg-[var(--app-accent)] px-4 py-2 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--app-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                    >
                        Try again
                    </button>
                </>
            ) : (
                <>
                    <Logo
                        className="flex items-center justify-center gap-6 drop-shadow-[0_8px_14px_rgba(56,35,68,0.2)] mb-24"
                        iconClassName="h-auto w-36"
                        titleClassName="text-[9rem]! leading-none"
                    />
                    <MoonLoader
                        color="var(--app-secondary)"
                        size={48}
                        speedMultiplier={0.35}
                    />
                    <p className="text-lg text-[var(--text-secondary)]">
                        Loading data...
                    </p>
                </>
            )}
        </main>
    );
}
