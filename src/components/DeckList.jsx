// Libs
import { useEffect, useRef, useState } from 'react';
import { MoonLoader } from 'react-spinners';

// Components
import ManaCost from './ManaCost';

// Utils
import { isCardHoverSuppressed } from '../util/hoverManager';
import { SquareMinus, SquarePlus } from 'lucide-react';
import { getCopyLimit } from '../util/cardRules';

function DeckItem({ card, addCard, removeCard }) {
    const [hovered, setHovered] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [previewLoaded, setPreviewLoaded] = useState(false);
    const [previewError, setPreviewError] = useState(false);


    const hoverTimer = useRef(null);
    const itemRef = useRef(null);

    const uri = card.image_uris?.normal
        ?? card.card_faces?.[0]?.image_uris?.normal;
    const previewWidth = Math.min(
        400 + Math.max(0, (window.innerWidth - 1920) * 0.15),
        550
    );
    const previewHeight = previewWidth * 1.4 + 16;
    const offset = 24;
    const padding = 16;

    const copyLimit = getCopyLimit(card);
    const quantity = card.quantity ?? 0;
    const atCopyLimit = copyLimit !== null && quantity >= copyLimit;

    useEffect(() => {
        const item = itemRef.current;
        if (!item) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    clearTimeout(hoverTimer.current);
                    setHovered(false);
                }
            },
            { threshold: 0 }
        );

        observer.observe(item);

        return () => {
            observer.disconnect();
            clearTimeout(hoverTimer.current);
        };
    }, []);

    const handleMouseMove = (event) => {
        if (!uri || isCardHoverSuppressed()) {
            clearTimeout(hoverTimer.current);
            setHovered(false);
            return;
        }

        let x = event.clientX + offset;

        if (x + previewWidth > window.innerWidth - padding) {
            x = event.clientX - previewWidth - offset;
        }

        x = Math.max(
            padding,
            Math.min(x, window.innerWidth - previewWidth - padding)
        );

        let y = event.clientY - previewHeight / 2;

        y = Math.max(
            padding,
            Math.min(y, window.innerHeight - previewHeight - padding)
        );

        setPosition({ x, y });
    };

    const handleMouseEnter = () => {
        if (!uri || isCardHoverSuppressed()) return;

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
                ref={itemRef}
                style={{
                    borderRadius: 'var(--border-radius)',
                    border: '2px solid transparent',
                    background: `
                        linear-gradient(var(--app-bg), var(--mana-mc)) padding-box,
                        linear-gradient(to left, ${card.colors?.length
                            ? card.colors.map(color => `var(--mana-${color.toLowerCase()})`).join(', ')
                            : 'var(--mana-nc)'
                        }) border-box
                    `
                }}
                className={`${uri ? 'cursor-pointer' : undefined} flex flex-row gap-4 items-baseline mb-1.5`}
            >
                <span className='translate-y-1 ml-2'>
                    <button>
                        <SquareMinus size={18} onClick={() => { removeCard(card) }} />
                    </button>
                </span>
                <span className='translate-y-1 mr-3'>
                    <button disabled={atCopyLimit}>
                        <SquarePlus
                            size={18}
                            style={{ color: atCopyLimit ? 'red' : 'var(--app-secondary)' }}
                            onClick={() => { addCard(card) }}
                        />
                    </button>
                </span>
                <span>
                    {card.quantity}
                </span>
                <span
                    className='flex-1 truncate'
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                >
                    {card.name}
                </span>
                <span className=' mr-3 cursor-default'>
                    <ManaCost manaCost={card.mana_cost} size={20} />
                </span>
            </div>

            {hovered && (
                <div
                    className="fixed z-[9999] pointer-events-none transition-opacity duration-150 animate-in fade-in zoom-in-95"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: 'translateY(-10%)'
                    }}
                >
                    <div
                        className="relative flex min-h-[16rem] items-center justify-center p-2 bg-[var(--app-panel)] border border-[var(--app-accent)] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8),0_0_15px_var(--app-accent)]"
                        style={{ width: `${previewWidth}px` }}
                    >
                        {!previewLoaded && !previewError && (
                            <MoonLoader
                                color="var(--app-secondary)"
                                size={32}
                                speedMultiplier={0.35}
                            />
                        )}

                        {previewError ? (
                            <p className="text-sm text-[var(--text-secondary)]">
                                Preview unavailable
                            </p>
                        ) : (
                            <img
                                src={uri}
                                alt={card.name}
                                onLoad={() => setPreviewLoaded(true)}
                                onError={() => setPreviewError(true)}
                                style={{ width: `${previewWidth - 16}px` }}
                                className={`h-auto rounded-lg shadow-2xl select-none ${previewLoaded ? 'block' : 'hidden'
                                    }`}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default function DeckList({ deck, addCard, removeCard }) {
    const cards = Object.values(deck.cards).sort((a, b) => {
        const aCmc = Number(a.cmc);
        const bCmc = Number(b.cmc);
        const aHasCmc = Number.isFinite(aCmc) && aCmc > 0;
        const bHasCmc = Number.isFinite(bCmc) && bCmc > 0;

        if (aHasCmc !== bHasCmc) {
            return aHasCmc ? -1 : 1;
        }

        if (aHasCmc && aCmc !== bCmc) {
            return aCmc - bCmc;
        }

        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col gap-2 h-[85vh] flex-[1] min-w-0 overflow-y-scroll scrollbar scrollbar-track-[var(--app-panel)] scrollbar-thumb-[var(--app-accent)] pr-2">
            {cards.map((card) => {
                return (
                    <DeckItem key={card.id} card={card} addCard={addCard} removeCard={removeCard} />
                )
            })}
        </div>
    );
}
