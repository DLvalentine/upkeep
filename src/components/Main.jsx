
// Libs
import { useEffect, useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';

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

        findCards(debouncedQuery)
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
    }, [debouncedQuery]);

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
            <div className="inline-flex gap-8 items-center bg-[var(--app-accent)] border-b-2 border-[var(--bg-nav)]">
                <Logo />

                <SearchBox
                    value={searchQuery}
                    onChange={handleSearchChange}
                    showX={!!searchQuery}
                    onClickX={handleClear}
                />
            </div>
            <Browser query={debouncedQuery} cards={searchResults}/>
        </div>
    );
}
