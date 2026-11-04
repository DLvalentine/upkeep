// Libs
import localforage from 'localforage';
import Fuse from 'fuse.js';

const ONE_HOUR_MS = 3_600_000;

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
        const res = await fetch('/upkeep/cards.jsonl.gz');
        const data = await res.arrayBuffer();
        const rawJSONL = await new Response(data).text();
        const parsedJSON = rawJSONL.trim().split('\n').map(JSON.parse) || {};

        await localforage.setItem('cards', parsedJSON);
        await localforage.setItem('lastUpdated', Date.now());
        return parsedJSON;
    }
}

/**
 * TODO - Determine the keys to use or how we pass them (filters). Currently it just finds by name.
 * TODO - tune threshold - ask user if they wanna expand their search maybe
 * Given a queryString, search through the cards data to try and find the card you're looking for.
 * This search uses fuse, and a threshold of 0.3, which is fairly fuzzy. It will find a handful of matches, even when you use exact wording. 
 * @param {String} queryString - the string to use to search through the data for 
 * @returns {Array<Object>} Array of card objects. See #loadCards for details on relevant fields.
 */
export async function findCards(queryString) {
    const cards = await loadCardData();

    const fuse = new Fuse(cards, {
        keys: ['name'],
        threshold: 0.25,
        includeScore: true,
    });

    return fuse.search(queryString);
}
