
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
4 Gleaming Geardrake (MKM) 205
10 Island (USG) 336
11 Mountain (USG) 343
1 Saheeli, Filigree Master (BRO) 219
2 Reckless Detective (MKM) 141
2 Curious Inquiry (MKM) 51
4 Shock (MKM) 144
2 Dramatic Accusation (MKM) 53
2 Harried Dronesmith (MKM) 131
2 Deduce (MKM) 52
4 Sokenzan Smelter (NEO) 164
4 Voltage Surge (NEO) 171
2 Coastal Bulwark (BRO) 76
2 Swiftwater Cliffs (MOM) 273
2 Negate (DMU) 58
2 Detective's Satchel (MKM) 196
2 Mistway Spy (MKM) 65
2 The Echoverse Fulcrum (FRA) 169
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
                <DeckList deck={deck} addCard={addCard} removeCard={removeCard}/>
            </div>
        </div>
    );
}
