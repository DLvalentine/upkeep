
// Libs
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';

// Services
import { findCards, loadCardData } from '../services/cardService';

// Components
import Logo from './Logo';
import SearchBox from './SearchBox';
import Browser from './Browser';
import FilterPopover from './FilterPopover';
import SearchSettingsPopover from './SearchSettingsPopover';
import LoadingScreen from './LoadingScreen';
import DeckList from './DeckList';

// Utils
import { getCopyLimit } from '../util/cardRules';
import { importDeck } from '../util/decklist';

const SAMPLE_DECKLIST = `
Deck
2 Ashaya, Soul of the Wild (ZNR) 179
2 Esika's Chariot (KHM) 169
4 Tajuru Blightblade (ZNR) 208
4 Werewolf Pack Leader (AFR) 211
4 Kazandu Nectarpot (ZNR) 190
2 Apprentice Sharpshooter (VOW) 185
1 Wedding Invitation (VOW) 260
1 Kazandu Mammoth (ZNR) 189
2 Elderleaf Mentor (KHM) 165
1 Joraga Visionary (ZNR) 188
2 Choose Your Weapon (AFR) 175
1 Big Play (STX) 122
1 Bull's Strength (AFR) 174
1 Inscription of Abundance (ZNR) 186
1 Scale the Heights (ZNR) 202
1 Vastwood Surge (ZNR) 217
1 You Meet in a Tavern (AFR) 215
2 Arachnoform (KHM) 159
12 Forest (AKR) 298
1 Dormant Grove (VOW) 198
12 Forest (KLR) 301
1 Druid Class (AFR) 180
1 King Harald's Revenge (KHM) 180
`;

export default function Main() {
    // Card data is required before the sample deck can be resolved.
    const [isCardDataReady, setIsCardDataReady] = useState(false);
    const [cardDataError, setCardDataError] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);

    // Search query and debounce handler.
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 500);

    // Search options
    const [sortKey, setSortKey] = useState('edhrec_rank');
    const [sortDesc, setSortDesc] = useState(false);
    const [filters, setFilters] = useState({});
    const [searchSettings, setSearchSettings] = useState({
        strictSearch: true,
        searchKeys: ['name']
    });

    // Search results
    const [searchResults, setSearchResults] = useState(null);

    const [deck, setDeck] = useState({ cards: {}, size: 0 });

    useEffect(() => {
        let cancelled = false;

        loadCardData()
            .then(cards => {
                if (cancelled) return;

                setDeck(importDeck(SAMPLE_DECKLIST, cards).deck);
                setIsCardDataReady(true);
            })
            .catch(error => {
                if (!cancelled) {
                    console.error('Card data failed to load:', error);
                    setCardDataError(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [loadAttempt]);

    const handleRetryCardDataLoad = () => {
        setCardDataError(false);
        setLoadAttempt(attempt => attempt + 1);
    };

    const addCard = (card) => {
        const copyLimit = getCopyLimit(card);

        setDeck(currentDeck => {
            const existingCard = currentDeck.cards[card.id];
            const currentQuantity = existingCard?.quantity ?? 0;

            // Enforce the card's copy limit.
            if (copyLimit !== null && currentQuantity >= copyLimit) {
                return currentDeck;
            }

            const cards = { ...currentDeck.cards };

            if (existingCard) {
                cards[card.id] = {
                    ...existingCard,
                    quantity: currentQuantity + 1
                };
            } else {
                cards[card.id] = {
                    ...card,
                    quantity: 1
                };
            }

            return {
                cards,
                size: currentDeck.size + 1
            };
        });
    };

    const removeCard = (card) => {
        setDeck(currentDeck => {
            const existingCard = currentDeck.cards[card.id];

            // Nothing to remove.
            if (!existingCard || existingCard.quantity <= 0) {
                return currentDeck;
            }

            const cards = { ...currentDeck.cards };
            const newQuantity = existingCard.quantity - 1;

            if (newQuantity === 0) {
                delete cards[card.id];
            } else {
                cards[card.id] = {
                    ...existingCard,
                    quantity: newQuantity
                };
            }

            return {
                cards,
                size: currentDeck.size - 1
            };
        });
    };


    useEffect(() => {
        const query = debouncedQuery.trim();

        if (query.length < 3) {
            setSearchResults(null);
            return;
        }

        let cancelled = false;

        findCards(
            query,
            searchSettings.strictSearch,
            sortKey,
            sortDesc,
            searchSettings.searchKeys,
            filters
        )
            .then(results => {
                if (!cancelled) {
                    setSearchResults(results);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    console.error('Card search failed:', error);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        debouncedQuery,
        searchSettings,
        sortKey,
        sortDesc,
        filters
    ]);

    const handleSearchChange = (e) => {
        const value = e.target.value;

        setSearchQuery(value);

        if (!value.trim()) {
            setSearchResults(null);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults(null);
    };

    if (!isCardDataReady) {
        return (
            <LoadingScreen
                error={cardDataError}
                onRetry={handleRetryCardDataLoad}
            />
        );
    }

    return (
        <div className="flex flex-col gap-y-6">
            <div className="
                inline-flex gap-2 items-center
                bg-[var(--app-accent)]
                border-b-2 border-[var(--bg-nav)]
            ">
                <Logo />

                <SearchBox
                    value={searchQuery}
                    onChange={handleSearchChange}
                    showX={!!searchQuery}
                    onClickX={handleClear}
                />

                <div className="inline-flex gap-4 items-center">
                    {sortDesc ? (
                        <button
                            type="button"
                            aria-label="Sort ascending"
                            title="Sort ascending"
                            onClick={() => setSortDesc(false)}
                            className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                        >
                            <ArrowDownNarrowWide
                                size={24}
                                style={{ color: 'var(--app-secondary)' }}
                            />
                        </button>
                    ) : (
                        <button
                            type="button"
                            aria-label="Sort descending"
                            title="Sort descending"
                            onClick={() => setSortDesc(true)}
                            className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                        >
                            <ArrowUpNarrowWide
                                size={24}
                                style={{ color: 'var(--app-secondary)' }}
                            />
                        </button>
                    )}

                    <FilterPopover
                        filters={filters}
                        onApply={setFilters}
                    />

                    <SearchSettingsPopover
                        settings={searchSettings}
                        onApply={setSearchSettings}
                        sortKey={sortKey}
                        onSortKeyChange={setSortKey}
                    />
                </div>
            </div>

            <div className='flex flex-row gap-2'>
                <Browser
                    query={debouncedQuery}
                    cards={searchResults}
                    deck={deck}
                    addCard={addCard}
                    removeCard={removeCard}
                />
                <DeckList deck={deck}/>
            </div>
        </div>
    );
}
