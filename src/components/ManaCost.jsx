const DEFAULT_SYMBOL_SIZE = 24;
const SPRITE_CELL_SIZE = 105;
const SPRITE_SYMBOL_SIZE = 100;
const SPRITE_WIDTH = 1045;
const SPRITE_HEIGHT = 730.002;

const SYMBOL_POSITIONS = {
    X: [1, 2],
    Y: [2, 2],
    Z: [3, 2],
    W: [4, 2],
    U: [5, 2],
    B: [6, 2],
    R: [7, 2],
    G: [8, 2],
    C: [9, 2],
    T: [0, 5],
    Q: [1, 5],
    '\u221E': [2, 5],
    '\u00BD': [3, 5],
    S: [6, 5],
    'W/U': [0, 3],
    'W/B': [1, 3],
    'U/B': [2, 3],
    'U/R': [3, 3],
    'B/R': [4, 3],
    'B/G': [5, 3],
    'R/W': [6, 3],
    'R/G': [7, 3],
    'G/W': [8, 3],
    'G/U': [9, 3],
    '2/W': [0, 4],
    '2/U': [1, 4],
    '2/B': [2, 4],
    '2/R': [3, 4],
    '2/G': [4, 4],
    'W/P': [5, 4],
    'U/P': [6, 4],
    'B/P': [7, 4],
    'R/P': [8, 4],
    'G/P': [9, 4]
};

function getSymbolPosition(symbol) {
    if (/^\d+$/.test(symbol)) {
        const value = Number(symbol);

        if (value >= 0 && value <= 20) {
            return value === 20
                ? [0, 2]
                : [value % 10, Math.floor(value / 10)];
        }
    }

    return SYMBOL_POSITIONS[symbol] ?? null;
}

function parseManaCost(manaCost) {
    if (typeof manaCost !== 'string' || !manaCost) return [];

    const symbols = [];
    const pattern = /\{([^}]+)\}|\/\//g;
    let match;

    while ((match = pattern.exec(manaCost)) !== null) {
        symbols.push(match[0] === '//'
            ? { type: 'separator' }
            : { type: 'symbol', value: match[1] }
        );
    }

    return symbols;
}

function ManaSymbol({ symbol, size }) {
    const position = getSymbolPosition(symbol);

    if (!position) {
        return (
            <span
                className="inline-flex items-center justify-center rounded-full bg-[var(--app-panel)] px-1 text-xs font-semibold text-[var(--text-primary)]"
                title={`{${symbol}}`}
                style={{
                    minWidth: `${size}px`,
                    height: `${size}px`
                }}
            >
                {symbol}
            </span>
        );
    }

    const [column, row] = position;
    const spriteScale = size / SPRITE_SYMBOL_SIZE;

    return (
        <span
            className="inline-block shrink-0"
            title={`{${symbol}}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundImage: `url(${import.meta.env.BASE_URL}mana.svg)`,
                backgroundPosition: `${-column * SPRITE_CELL_SIZE * spriteScale}px ${-row * SPRITE_CELL_SIZE * spriteScale}px`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `${SPRITE_WIDTH * spriteScale}px ${SPRITE_HEIGHT * spriteScale}px`
            }}
        />
    );
}

export default function ManaCost({ manaCost, size = DEFAULT_SYMBOL_SIZE }) {
    const symbols = parseManaCost(manaCost);
    const symbolSize = Number.isFinite(Number(size)) && Number(size) > 0
        ? Number(size)
        : DEFAULT_SYMBOL_SIZE;

    if (!symbols.length) return null;

    return (
        <span
            className="inline-flex items-center gap-px align-middle"
            role="img"
            aria-label={`Mana cost ${manaCost}`}
        >
            {symbols.map((symbol, index) => symbol.type === 'separator' ? (
                <span
                    key={`separator-${index}`}
                    className="mx-1 text-sm text-[var(--text-secondary)]"
                    aria-hidden="true"
                    style={{ fontSize: `${symbolSize * 0.6}px` }}
                >
                    //
                </span>
            ) : (
                <ManaSymbol
                    key={`${symbol.value}-${index}`}
                    symbol={symbol.value}
                    size={symbolSize}
                />
            ))}
        </span>
    );
}
