const DECK_SECTION_HEADERS = new Set([
    'deck',
    'commander',
    'companion',
    'sideboard',
    'maybeboard'
]);

function normaliseName(name) {
    return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function removePrintingDetails(name) {
    // Arena exports can append a set code and collector number, e.g.
    // "Gleaming Geardrake (MKM) 205". Deck state is keyed by card identity,
    // so only the card name belongs in an import lookup.
    return name.replace(/\s+\([^)]+\)\s+\S+\s*$/, '').trim();
}

/**
 * Reads a simple MTG decklist into its name-and-quantity representation.
 * Section headings are ignored, so cards listed under Commander or Sideboard
 * are intentionally merged into the returned deck list.
 *
 * @param {string} decklist
 * @returns {Array<{name: string, quantity: number}>}
 */
export function parseDecklist(decklist) {
    if (typeof decklist !== 'string') return [];

    const cardsByName = new Map();

    for (const rawLine of decklist.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || DECK_SECTION_HEADERS.has(line.toLocaleLowerCase())) {
            continue;
        }

        // Supports Arena's "4 Card Name" format as well as the common
        // "4x Card Name" variation.
        const match = line.match(/^(\d+)\s*x?\s+(.+?)\s*$/i);
        if (!match) continue;

        const quantity = Number(match[1]);
        const name = removePrintingDetails(match[2]);

        if (!Number.isSafeInteger(quantity) || quantity < 1 || !name) {
            continue;
        }

        const key = normaliseName(name);
        const existing = cardsByName.get(key);

        cardsByName.set(key, {
            name: existing?.name ?? name,
            quantity: (existing?.quantity ?? 0) + quantity
        });
    }

    return Array.from(cardsByName.values());
}

/**
 * Converts a text decklist into the deck state used by Main. The card pool is
 * used solely to map an imported card name to its complete card record and id.
 * Cards that cannot be resolved are returned separately instead of discarded
 * silently.
 *
 * @param {string} decklist
 * @param {Array<Object>} cardPool
 * @returns {{deck: {cards: Object, size: number}, missingCards: Array<{name: string, quantity: number}>}}
 */
export function importDeck(decklist, cardPool = []) {
    const cardsByName = new Map();

    for (const card of cardPool) {
        if (card?.id && typeof card.name === 'string') {
            const key = normaliseName(card.name);

            if (!cardsByName.has(key)) {
                cardsByName.set(key, card);
            }
        }
    }

    const deck = { cards: {}, size: 0 };
    const missingCards = [];

    for (const entry of parseDecklist(decklist)) {
        const card = cardsByName.get(normaliseName(entry.name));

        if (!card) {
            missingCards.push(entry);
            continue;
        }

        const existingCard = deck.cards[card.id];
        const quantity = (existingCard?.quantity ?? 0) + entry.quantity;

        deck.cards[card.id] = { ...card, quantity };
        deck.size += entry.quantity;
    }

    return { deck, missingCards };
}

/**
 * Formats Main's deck state as the minimal deck-only format accepted by
 * MTG Arena. Commander and sideboard sections are deliberately omitted.
 *
 * @param {{cards?: Object}} deck
 * @returns {string}
 */
export function exportDeck(deck) {
    const cardsByName = new Map();

    for (const card of Object.values(deck?.cards ?? {})) {
        const quantity = Number(card?.quantity);
        const name = typeof card?.name === 'string' ? card.name.trim() : '';

        if (!Number.isSafeInteger(quantity) || quantity < 1 || !name) {
            continue;
        }

        const key = normaliseName(name);
        const existing = cardsByName.get(key);

        cardsByName.set(key, {
            name: existing?.name ?? name,
            quantity: (existing?.quantity ?? 0) + quantity
        });
    }

    const lines = Array.from(cardsByName.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ quantity, name }) => `${quantity} ${name}`);

    return ['Deck', ...lines].join('\n');
}
