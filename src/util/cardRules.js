
const NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10
};

export function getCopyLimit(card, defaultLimit = 4) {
    if (!card) return defaultLimit;

    if (/\bBasic\b/i.test(card.type_line || '')) {
        return null;
    }

    const oracleText = [
        card.oracle_text || '',
        ...(card.card_faces || []).map(face => face.oracle_text || '')
    ].join('\n');

    const match = oracleText.match(
        /a deck can have up to\s+(\d+|[a-z]+)\s+cards named/i
    );

    if (match) {
        const value = match[1].toLowerCase();
        const limit = NUMBER_WORDS[value] ?? Number(value);

        if (Number.isFinite(limit) && limit > 0) {
            return limit;
        }
    }

    if (/a deck can have any number of cards named/i.test(oracleText)) {
        return null;
    }

    return defaultLimit;
}
