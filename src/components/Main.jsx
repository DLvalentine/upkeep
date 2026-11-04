
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

export default function Main() {
    // Search query and debounce handler.
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 500);

    // Search options
    const [strictSearch, setStrictSearch] = useState(true);
    const [sortKey, setSortKey] = useState('edhrec_rank');
    const [sortDesc, setSortDesc] = useState(true);
    const [searchKeys, setSearchKeys] = useState(['name']);
    const [filters, setFilters] = useState({});

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
            strictSearch,
            sortKey,
            sortDesc,
            searchKeys,
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
        strictSearch,
        sortKey,
        sortDesc,
        searchKeys,
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
                        <ArrowDownNarrowWide
                            size={24}
                            style={{ color: 'var(--app-secondary)' }}
                            onClick={() => setSortDesc(false)}
                        />
                    ) : (
                        <ArrowUpNarrowWide
                            size={24}
                            style={{ color: 'var(--app-secondary)' }}
                            onClick={() => setSortDesc(true)}
                        />
                    )}

                    <FilterPopover
                        filters={filters}
                        onApply={setFilters}
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
