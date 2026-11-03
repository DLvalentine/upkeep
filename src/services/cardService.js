import localforage from 'localforage';
import Fuse from 'fuse.js';

/**
 * Loads cards from gzipped archive, and caches it in the proper data store via localforage.
 * Notable fields:
 *  - colors {Array<String>}
 *  - convertedManaCost {Number}
 *  - identifiers -> scryfallOracleId {String}
 *  - keywords {Array<String>}
 *  - manaCost {String}
 *  - name {String}
 *  - power {String}
 *  - toughness {String}
 *  - relatedCards {Object}
 *  - subtypes {Array<String>}
 *  - text {String}
 *  - type {String}
 *  - types {Array<String>}
 * @returns {Object} An object representing all Modern legal cards, keyed by the card's name.
 */
export async function loadCards() {
    const cachedCards = await localforage.getItem('cards');

    if (cachedCards) {
        return cachedCards;
    } else {
        const res = await fetch('/upkeep/cards.json.gz');
        const data = await res.arrayBuffer();
        const rawJSON = await new Response(data).text();
        const parsedJSON = JSON.parse(rawJSON)?.data || {};

        await localforage.setItem('cards', parsedJSON);
        return parsedJSON;
    }
}

/**
 * Given a card Object and image size String (or default normal), this will return the URI that should be used to render the card image.
 * @param {Object} card - The card Object as described by loadCards to pull the scryfall identifier from
 * @param {String = 'normal'} size - The size to return. Should be one of: [small, normal, large]
 * @returns 
 */
export async function getCardImageFromId(card, size = 'normal') {
    if (!['small', 'normal', 'large'].includes(size)) {
        throw new Error('Invalid image size. Use small, normal, or large.');
    }

    const response = await fetch(
        `https://api.scryfall.com/cards/search?q=oracleid:${card.identifiers.scryfallOracleId} prefer:default&unique=cards`
    );

    if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data = await response.json();

    const imageUris = data.data[0]?.image_uris
        ?? data[0]?.card_faces?.map(face => face.image_uris)
        ?? null;

    return imageUris?.[size];
}

/**
 * TODO - Determine the keys to use or how we pass them (filters). Currently it just finds by name.
 * TODO - tune threshold
 * Given a queryString, search through the cards data to try and find the card you're looking for.
 * This search uses fuse, and a threshold of 0.3, which is fairly fuzzy. It will find a handful of matches, even when you use exact wording. 
 * @param {String} queryString - the string to use to search through the data for 
 * @returns {Array<Object>} Array of card objects. See #loadCards for details on relevant fields.
 */
export async function findCards(queryString) {
    const cards = await loadCards();
    const flattenedCards = Object.values(cards).map((card) => card[0]);

    const fuse = new Fuse(flattenedCards, {
        keys: ['text'],
        threshold: 0.3,
        includeScore: true,
    });

    return fuse.search(queryString); 
}
