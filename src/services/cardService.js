// Libs
import localforage from 'localforage';
import Fuse from 'fuse.js';

const ONE_HOUR_MS = 3_600_000;

const SORT_KEYS = new Set([
    'edhrec_rank',
    'name',
    'toughness',
    'power',
    'cmc',
]);

const EXCLUDED_LAYOUTS = new Set([
    'token',
    'double_faced_token',
    'art_series',
    'scheme',
    'planar',
    'vanguard',
    'phenomenon',
    'conspiracy',
    'emblem',
]);

const EXCLUDED_TYPES = [
    'Plane',
    'Phenomenon',
    'Scheme',
    'Vanguard',
    'Conspiracy',
    'Card'
];

/**
 * Returns true if card does not contain exlcuded types or layouts, to be used as a filter when building the cache
 * @param {Object} card - The scryfall Card Object to check 
 * @returns 
 */
function isSearchableCard(card) {
    if (EXCLUDED_LAYOUTS.has(card.layout)) {
        return false;
    }

    if (card.type_line?.includes('Token')) {
        return false;
    }

    if (EXCLUDED_TYPES.some(type =>
        card.type_line?.includes(type)
    )) {
        return false;
    }

    return true;
}

/**
 * Loads cards from gzipped archive, and caches it in the proper data store via localforage.
 * Notable fields:
 * - cmc
 * - colors
 * - id
 * - image_uris
 * - keywords
 * - legalities
 * - mana_cost
 * - name
 * - oracle_text
 * - power
 * - toughness
 * - rarity
 * - set
 * - type_line
 * @returns {Object} Scryfall Object representation of MTG card data
 */
export async function loadCardData() {
    const lastUpdated = await localforage.getItem('lastUpdated');
    const cachedCards = await localforage.getItem('cards');
    const isCacheValid = lastUpdated && (Date.now() - lastUpdated < ONE_HOUR_MS);

    if (cachedCards && isCacheValid) {
        return cachedCards;
    } else {
        const res = await fetch(`${import.meta.env.BASE_URL}cards.jsonl.gz`);
        const data = await res.arrayBuffer();

        // Gzip files begin with the magic byte signature 0x1F 0x8B.
        // Check the response to determine whether the browser has already
        // decompressed it (Content-Encoding: gzip) or if manual decompression
        // is necessary.
        const isGzipped = new Uint8Array(data)[0] === 0x1f;
        const rawJSONL = isGzipped
            ? await new Response(
                new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'))
            ).text()
            : new TextDecoder().decode(data);

        // Proceed with parsing
        const parsedJSON = rawJSONL.trim().split('\n').map(JSON.parse).filter(isSearchableCard);

        await localforage.setItem('cards', parsedJSON);
        await localforage.setItem('lastUpdated', Date.now());

        return parsedJSON;
    }
}

/**
 * Search through the card data to find your card(s). Card data is pulled from local cache, filtered, then indexed before being searched.
 * @param {String} queryString - The user's search query
 * @param {Boolean} strictSearch - Default true, if false the search will be "fuzzy" so even mis-remembered card names (e.g. Enchanting Wilds) will resolve to their proper names (Evolving Wilds)
 * @param {String} sortKey - The object key to use to sort the results by. Limited to one key for now.
 * @param {Boolean} sortDesc - If true, sort in descending fashion. If false, ascending.
 * @param {Array<String>} searchKeys - The object keys to use in your search.
 * @param {Object} filters - Structured card filters.
 * @param {String|Array<String>} filters.type - Card type(s).
 * @param {String|Array<String>} filters.colorIdentity - Required colors.
 * @param {String|Array<String>} filters.colorIdentityExact - If 'exact', will allow for mono-<color> filtering
 * @param {Number|Object} filters.cmc - Exact mana value or range.
 * @returns {Array<Object>} A filtered, sorted array of Cards
 */
export async function findCards(queryString, strictSearch = true, sortKey = 'edhrec_rank', sortDesc = true, searchKeys = ['name'], filters = {}) {
    const cards = await loadCardData();
    const validSortKey = SORT_KEYS.has(sortKey) ? sortKey : 'edhrec_rank';

    const types = filters.type
        ? (Array.isArray(filters.type) ? filters.type : [filters.type])
        : [];

    const colors = filters.colorIdentity
        ? (Array.isArray(filters.colorIdentity)
            ? filters.colorIdentity
            : [filters.colorIdentity]
        ).map(c => c.toUpperCase())
        : [];

    const hasFilters =
        types.length > 0 ||
        colors.length > 0 ||
        filters.cmc?.exact !== undefined ||
        filters.cmc?.min !== undefined ||
        filters.cmc?.max !== undefined;

    console.log(filters.colorIdentityExact)

    const filteredCards = hasFilters ? cards.filter(card => {
        // Type filter
        if (types.length > 0) {
            if (!types.some(type =>
                card.type_line?.toLowerCase().includes(type.toLowerCase())
            )) return false;
        }

        // Color identity filter
        if (colors.length > 0) {
            const cardColors = card.color_identity ?? [];

            if (filters.colorIdentityExact) {
                if (
                    cardColors.length !== colors.length ||
                    !colors.every(color => cardColors.includes(color))
                ) return false;
            } else {
                if (!colors.every(color => cardColors.includes(color))) {
                    return false;
                }
            }
        }

        // CMC / mana value filter
        if (filters.cmc !== undefined) {
            const cmc = typeof filters.cmc === 'number'
                ? { exact: filters.cmc }
                : filters.cmc;

            if (cmc.exact !== undefined && card.cmc !== cmc.exact) {
                return false;
            }

            if (cmc.min !== undefined && card.cmc < cmc.min) {
                return false;
            }

            if (cmc.max !== undefined && card.cmc > cmc.max) {
                return false;
            }
        }

        return true;
    }) : cards;

    const fuse = new Fuse(filteredCards, {
        keys: Array.from(new Set([validSortKey, ...searchKeys])),
        threshold: strictSearch ? 0.19 : 0.39,
        sortFn: (a, b) => {
            const aVal = a.item?.[0]?.v;
            const bVal = b.item?.[0]?.v;

            // Missing values go to the bottom
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            const aNum = Number(aVal);
            const bNum = Number(bVal);

            // Numeric comparison
            if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                return sortDesc ? bNum - aNum : aNum - bNum;
            }

            // String comparison
            const comparison = String(aVal).localeCompare(String(bVal));

            return sortDesc ? -comparison : comparison;
        }
    });

    return fuse.search(queryString);
}
