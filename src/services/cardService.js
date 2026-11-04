// Libs
import localforage from 'localforage';
import Fuse from 'fuse.js';

const ONE_HOUR_MS = 3_600_000;

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
 * TODO - Determine the keys to use or how we pass them (filters). Currently it just finds by name.
 * TODO - Determine how to sort. We can only sort based on keys if we want to do it here and not later on.
 * TODO - tune threshold - ask user if they wanna expand their search maybe. The sweet spot before we have too many results is ~0.19
 * Given a queryString, search through the cards data to try and find the card you're looking for.
 * This search uses fuse, and a threshold of 0.3, which is fairly fuzzy. It will find a handful of matches, even when you use exact wording. 
 * @param {String} queryString - the string to use to search through the data for 
 * @returns {Array<Object>} Array of card objects. See #loadCards for details on relevant fields.
 */
export async function findCards(queryString) {
    const cards = await loadCardData();

    const fuse = new Fuse(cards, {
        keys: ['edhrec_rank', 'name'],
        threshold: 0.19,
        sortFn: (a, b) => {
            return a.item?.[0]?.v - b.item?.[0]?.v;
        }
    });

    return fuse.search(queryString);
}
