
// Libs
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Funnel, FunnelPlus } from 'lucide-react';

// Services
import { findCards } from '../services/cardService';

// Components
import Logo from './Logo';
import SearchBox from './SearchBox';
import Browser from './Browser';

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

    // Search results: holds the array of objects returned from the card service's search function
    const [searchResults, setSearchResults] = useState(null);

    useEffect(() => {
        if (debouncedQuery.length < 3)
            return;

        if (!debouncedQuery.trim()) {
            setSearchResults(null);
            return;
        }

        let cancelled = false;

        findCards(debouncedQuery, strictSearch, sortKey, sortDesc, searchKeys, filters)
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
    }, [debouncedQuery, sortDesc]);

    const handleSearchChange = (e) => {
        const value = e.target.value;

        setSearchQuery(value);

        // Clear results immediately instead of waiting for debounce.
        if (!value.trim()) {
            setSearchResults(null);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults(null);
    };

    return (
        <div className='flex flex-col gap-y-6'>
            <div className="inline-flex gap-2 items-center bg-[var(--app-accent)] border-b-2 border-[var(--bg-nav)]">
                <Logo />

                <SearchBox
                    value={searchQuery}
                    onChange={handleSearchChange}
                    showX={!!searchQuery}
                    onClickX={handleClear}
                />
                <div className='inline-flex gap-4'>
                    {sortDesc && <ArrowDownNarrowWide size={24} style={{ color: 'var(--app-secondary)' }} onClick={() => { setSortDesc(false) }} /> || <ArrowUpNarrowWide size={24} style={{ color: 'var(--app-secondary)' }} onClick={() => { setSortDesc(true) }} />}
                    {Object.keys(filters)?.length && <FunnelPlus size={24} style={{ color: 'var(--app-secondary)' }} /> || <Funnel size={24} style={{ color: 'var(--app-secondary)' }} />}
                </div>
            </div>
            <Browser query={debouncedQuery} cards={searchResults} />
        </div>
    );
}
