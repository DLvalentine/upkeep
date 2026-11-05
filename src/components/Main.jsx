
// Libs
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import {
    ArrowDownNarrowWide,
    ArrowUpNarrowWide,
    Upload,
    Download
} from 'lucide-react';

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
import CompanionLauncher from './CompanionLauncher';

// Utils
import { getCopyLimit } from '../util/cardRules';
import { importDeck, exportDeck } from '../util/decklist';

const SAMPLE_DECKLIST = `
Deck
1 Annex Sentry (ONE) 2
4 Crawling Chorus (ONE) 8
4 Jawbone Duelist (ONE) 18
4 Skrelv, Defector Mite (ONE) 33
3 Charge of the Mites (ONE) 6
2 Destroy Evil (DMU) 17
1 Expel the Interlopers (WOE) 13
4 Lay Down Arms (BRO) 11
2 White Sun's Twilight (ONE) 38
3 Ossification (ONE) 26
4 Skrelv's Hive (ONE) 34
3 Tocasia's Welcome (BRO) 30
4 Mirrex (ONE) 254
2 The Seedcore (ONE) 259
19 Plains (USG) 333
`;

export default function Main() {
    // Card data
    const [cardData, setCardData] = useState([]);
    const [isCardDataReady, setIsCardDataReady] = useState(false);
    const [cardDataError, setCardDataError] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);

    // Search query and debounce
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

    // Deck
    const [deck, setDeck] = useState({ cards: {}, size: 0 });

    // Import deck from clipboard
    const handleImportDeck = async () => {
        try {
            const decklist = await navigator.clipboard.readText();

            if (!decklist.trim()) {
                alert('Clipboard is empty.');
                return;
            }

            const { deck: importedDeck, missingCards } = importDeck(
                decklist,
                cardData
            );

            setDeck(importedDeck);

            if (missingCards.length > 0) {
                alert(
                    `Imported deck with ${missingCards.length} unresolved cards:\n\n` +
                    missingCards.map(card =>
                        `${card.quantity} ${card.name}`
                    ).join('\n')
                );
            }
        } catch (error) {
            console.error('Deck import failed:', error);
        }
    };

    // Export deck to clipboard
    const handleExportDeck = async () => {
        try {
            const decklist = exportDeck(deck);

            await navigator.clipboard.writeText(decklist);

            alert('Deck copied to clipboard!');
        } catch (error) {
            console.error('Deck export failed:', error);
            alert('Unable to copy deck to clipboard.');
        }
    };

    // Card data loading effect
    useEffect(() => {
        let cancelled = false;

        loadCardData()
            .then(cards => {
                if (cancelled) return;

                setCardData(cards);
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

    // Add card to deck
    const addCard = card => {
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

    // Remove card from deck
    const removeCard = card => {
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

    // Primary search effect
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

    const handleSearchChange = e => {
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
                flex w-full gap-2 items-center
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

                    <button
                        type="button"
                        aria-label="Import deck from clipboard"
                        title="Import deck from clipboard"
                        onClick={handleImportDeck}
                        className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                    >
                        <Upload
                            size={24}
                            style={{ color: 'var(--app-secondary)' }}
                        />
                    </button>

                    <button
                        type="button"
                        aria-label="Export deck to clipboard"
                        title="Export deck to clipboard"
                        onClick={handleExportDeck}
                        className="rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                    >
                        <Download
                            size={24}
                            style={{ color: 'var(--app-secondary)' }}
                        />
                    </button>
                </div>

                <div className="ml-auto shrink-0 pr-12">
                    <CompanionLauncher deck={deck} setSearchQuery={setSearchQuery} setFilters={setFilters} setSearchSettings={setSearchSettings} />
                </div>
            </div>

            <div className="flex flex-row gap-2">
                <Browser
                    query={debouncedQuery}
                    cards={searchResults}
                    deck={deck}
                    addCard={addCard}
                    removeCard={removeCard}
                />

                <DeckList
                    deck={deck}
                    addCard={addCard}
                    removeCard={removeCard}
                />
            </div>
        </div>
    );
}
