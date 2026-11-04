let suppressedUntil = 0;

export function suppressCardHover(duration = 300) {
    suppressedUntil = Date.now() + duration;
}

export function isCardHoverSuppressed() {
    return Date.now() < suppressedUntil;
}
