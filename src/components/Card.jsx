// Libs
import { useState, useRef, useEffect } from 'react';
import { MoonLoader } from 'react-spinners';
import { SquarePlus, SquareMinus } from 'lucide-react';

// Utils
import { isCardHoverSuppressed } from '../util/hoverManager';
import { getCopyLimit } from '../util/cardRules';

export default function Card({ uri, data, addCard, deck, removeCard }) {
    const [loaded, setLoaded] = useState(false);
    const [hovered, setHovered] = useState(false);
    const hoverTimer = useRef(null);
    const cardRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const copyLimit = getCopyLimit(data);
    const quantity = deck.cards[data.id]?.quantity ?? 0;
    const atCopyLimit = copyLimit !== null && quantity >= copyLimit;

    const previewWidth = Math.min(
        400 + Math.max(0, (window.innerWidth - 1920) * 0.15),
        550
    );
    const previewHeight = previewWidth * 1.4 + 16;
    const offset = 24;
    const padding = 64;

    // Dismiss preview when the card leaves the viewport
    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    clearTimeout(hoverTimer.current);
                    setHovered(false);
                }
            },
            { threshold: 0 }
        );

        observer.observe(card);

        return () => {
            observer.disconnect();
            clearTimeout(hoverTimer.current);
        };
    }, []);

    const handleMouseMove = (e) => {
        if (isCardHoverSuppressed()) {
            clearTimeout(hoverTimer.current);
            setHovered(false);
            return;
        }

        // Default: open to the right
        let x = e.clientX + offset;

        // Flip to the left if there's insufficient room
        if (x + previewWidth > window.innerWidth - padding) {
            x = e.clientX - previewWidth - offset;
        }

        // Keep within horizontal viewport bounds
        x = Math.max(
            padding,
            Math.min(x, window.innerWidth - previewWidth - padding)
        );

        // Center vertically around cursor
        let y = e.clientY - previewHeight / 2;

        y = Math.max(
            padding,
            Math.min(y, window.innerHeight - previewHeight - padding)
        );

        setPosition({ x, y });
    };

    const handleMouseEnter = () => {
        if (isCardHoverSuppressed()) return;

        hoverTimer.current = setTimeout(() => {
            if (!isCardHoverSuppressed()) {
                setHovered(true);
            }
        }, 400);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimer.current);
        setHovered(false);
    };

    return (
        <>
            <div
                ref={cardRef}
                className="relative w-full flex justify-center items-center aspect-[5/7] flex flex-col gap-1"
            >
                {!loaded && (
                    <div className="absolute inset-0 flex justify-center items-center">
                        <MoonLoader
                            color="var(--app-secondary)"
                            size={32}
                            speedMultiplier={0.35}
                        />
                    </div>
                )}

                <img
                    src={uri}
                    loading="lazy"
                    className="w-full h-auto object-contain z-10 cursor-pointer select-none"
                    onLoad={() => setLoaded(true)}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                />

                {loaded && (
                    <div className="flex flex-row gap-4">
                        <button disabled={deck.cards[data.id] === undefined || deck.cards[data.id]?.quantity === 0}>
                            <SquareMinus
                                size={24}
                                style={{ color: deck.cards[data.id] === undefined || deck.cards[data.id]?.quantity === 0 ? 'red' : 'var(--app-secondary)' }}
                                onClick={() => { removeCard(data) }}
                            />
                        </button>
                        <button disabled={atCopyLimit}>
                            <SquarePlus
                                size={24}
                                style={{ color: atCopyLimit ? 'red' : 'var(--app-secondary)' }}
                                onClick={() => { addCard(data) }}
                            />
                        </button>
                    </div>
                )}
            </div>

            {hovered && (
                <div
                    className="fixed z-[9999] pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: "translateY(-10%)"
                    }}
                >
                    <div className="p-2 bg-[var(--app-panel)] border border-[var(--app-accent)] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_var(--app-accent)]">
                        <img
                            src={uri}
                            style={{ width: `${previewWidth - 16}px` }}
                            className="h-auto rounded-lg shadow-2xl select-none"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
