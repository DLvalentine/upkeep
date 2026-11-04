
// Libs
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';

// Services
import { findCards } from '../services/cardService';

// Components
import Logo from './Logo';
import SearchBox from './SearchBox';
import Browser from './Browser';
import FilterPopover from './FilterPopover';
import SearchSettingsPopover from './SearchSettingsPopover';

export default function Main() {
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
    const [activePopover, setActivePopover] = useState(null);

    // Search results
    const [searchResults, setSearchResults] = useState(null);

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
                        open={activePopover === 'filters'}
                        onOpenChange={open =>
                            setActivePopover(open ? 'filters' : null)
                        }
                    />

                    <SearchSettingsPopover
                        settings={searchSettings}
                        onApply={setSearchSettings}
                        sortKey={sortKey}
                        onSortKeyChange={setSortKey}
                        open={activePopover === 'search-settings'}
                        onOpenChange={open =>
                            setActivePopover(open ? 'search-settings' : null)
                        }
                    />
                </div>
            </div>

            <Browser
                query={debouncedQuery}
                cards={searchResults}
            />
        </div>
    );
}
