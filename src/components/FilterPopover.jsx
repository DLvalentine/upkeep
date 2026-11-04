// Libs
import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Funnel, X } from 'lucide-react';

// Utils
import { suppressCardHover } from '../util/hoverManager';

const COLOR_OPTIONS = [
    { value: 'W', label: 'White' },
    { value: 'U', label: 'Blue' },
    { value: 'B', label: 'Black' },
    { value: 'R', label: 'Red' },
    { value: 'G', label: 'Green' }
];

const TYPE_OPTIONS = [
    'Creature',
    'Instant',
    'Sorcery',
    'Artifact',
    'Enchantment',
    'Land',
    'Planeswalker',
    'Battle'
];

function normalizeFilters(filters = {}) {
    const cmc = { ...(filters.cmc || {}) };

    // Exact and range are mutually exclusive. If both are present in an
    // older filter object, prefer exact so the UI has one unambiguous mode.
    if (cmc.exact !== undefined) {
        delete cmc.min;
        delete cmc.max;
    }

    return {
        type: Array.isArray(filters.type)
            ? [...filters.type]
            : filters.type
                ? [filters.type]
                : [],
        colorIdentity: Array.isArray(filters.colorIdentity)
            ? [...filters.colorIdentity]
            : filters.colorIdentity
                ? [filters.colorIdentity]
                : [],
        colorIdentityExact: filters.colorIdentityExact,
        cmc,
    };
}

function getActiveCount(filters = {}) {
    const normalized = normalizeFilters(filters);

    return (
        normalized.type.length +
        normalized.colorIdentity.length +
        (normalized.colorIdentityExact ? 1 : 0) +
        // Mana value is one logical filter, whether exact or a range.
        (Object.keys(normalized.cmc).length > 0 ? 1 : 0)
    );
}

function FilterGroup({ title, children }) {
    return (
        <section className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">{title}</h4>
            {children}
        </section>
    );
}

export default function FilterPopover({ filters, onApply }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(() => normalizeFilters(filters));
    const [cmcMode, setCmcMode] = useState(() =>
        filters?.cmc?.exact !== undefined ? 'exact' : 'range'
    );

    // Restore applied filters whenever the popover opens.
    useEffect(() => {
        if (open) {
            const normalized = normalizeFilters(filters);
            setDraft(normalized);
            setCmcMode(normalized.cmc.exact !== undefined ? 'exact' : 'range');
        }
    }, [open, filters]);

    const toggleValue = (key, value) => {
        setDraft(current => ({
            ...current,
            [key]: current[key].includes(value)
                ? current[key].filter(item => item !== value)
                : [...current[key], value]
        }));
    };

    const updateCmc = (key, value) => {
        setDraft(current => {
            const cmc = { ...current.cmc };

            if (value === '') {
                delete cmc[key];
            } else {
                const number = Number(value);

                if (!Number.isFinite(number) || number < 0) {
                    return current;
                }

                cmc[key] = number;
            }

            return { ...current, cmc };
        });
    };

    const changeCmcMode = mode => {
        if (mode === cmcMode) return;

        setCmcMode(mode);
        // Clear the previous mode so hidden values can never affect results
        // or unexpectedly reappear when the user switches modes.
        setDraft(current => ({ ...current, cmc: {} }));
    };

    const resetDraft = () => {
        setDraft(normalizeFilters());
        onApply({});
        setOpen(false);
    };

    const applyFilters = () => {
        const normalized = normalizeFilters(draft);

        const hasActiveFilters =
            normalized.type.length > 0 ||
            normalized.colorIdentity.length > 0 ||
            normalized.colorIdentityExact === true ||
            Object.keys(normalized.cmc).length > 0;

        onApply(hasActiveFilters ? normalized : {});
        setOpen(false);
    };

    const activeCount = getActiveCount(filters);
    const hasActiveFilters = activeCount > 0;

    return (
        <Popover.Root
            open={open}
            onOpenChange={nextOpen => {
                if (!nextOpen) {
                    suppressCardHover(400);
                }

                setOpen(nextOpen);
            }}
        >
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label="Card filters"
                    title={hasActiveFilters ? `${activeCount} active filters` : 'Card filters'}
                    className="relative flex items-center justify-center"
                >
                    <Funnel size={24} style={{ color: 'var(--app-secondary)' }} />

                    {hasActiveFilters && (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white bg-[var(--app-secondary)]">
                            {activeCount}
                        </span>
                    )}
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                    onInteractOutside={e => e.preventDefault()}
                    className="z-50 w-80 max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--bg-nav)] bg-[var(--app-panel)] text-[var(--app-text)] shadow-xl p-4"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Funnel size={18} />
                            <h3 className="font-semibold">Card Filters</h3>
                        </div>

                        <Popover.Close asChild>
                            <button
                                type="button"
                                aria-label="Close filters"
                                className="opacity-60 hover:opacity-100"
                            >
                                <X size={18} />
                            </button>
                        </Popover.Close>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Color Identity */}
                        <FilterGroup title="Color Identity">
                            <div className="flex flex-col">
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_OPTIONS.map(color => (
                                        <label
                                            key={color.value}
                                            title={color.label}
                                            className="flex items-center gap-1.5 cursor-pointer text-sm rounded-md border border-[var(--bg-nav)] px-2 py-1.5 hover:bg-black/10"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={draft.colorIdentity.includes(color.value)}
                                                onChange={() => toggleValue('colorIdentity', color.value)}
                                            />
                                            {color.value}
                                        </label>
                                    ))}
                                </div>
                                <label
                                    className="flex items-center gap-1.5 cursor-pointer text-sm rounded-md px-2 py-1.5 select-none"
                                >
                                    <input
                                        type="checkbox"
                                        checked={draft.colorIdentityExact ?? false}
                                        onChange={(e) => { setDraft(current => ({ ...current, colorIdentityExact: e.target.checked })) }}
                                    />
                                    Exact
                                </label>
                            </div>
                        </FilterGroup>

                        <div className="border-t border-[var(--bg-nav)]" />

                        {/* Card Types */}
                        <FilterGroup title="Card Type">
                            <div className="grid grid-cols-2 gap-2">
                                {TYPE_OPTIONS.map(type => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draft.type.includes(type)}
                                            onChange={() => toggleValue('type', type)}
                                        />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </FilterGroup>

                        <div className="border-t border-[var(--bg-nav)]" />

                        {/* Mana Value */}
                        <FilterGroup title="Mana Value">
                            <div className="grid grid-cols-2 gap-1 rounded-md bg-black/10 p-1">
                                <button
                                    type="button"
                                    onClick={() => changeCmcMode('range')}
                                    aria-pressed={cmcMode === 'range'}
                                    className={`rounded px-3 py-1.5 text-sm transition-colors ${cmcMode === 'range'
                                        ? 'bg-[var(--app-secondary)] text-white'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    Range
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeCmcMode('exact')}
                                    aria-pressed={cmcMode === 'exact'}
                                    className={`rounded px-3 py-1.5 text-sm transition-colors ${cmcMode === 'exact'
                                        ? 'bg-[var(--app-secondary)] text-white'
                                        : 'opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    Exact
                                </button>
                            </div>

                            {cmcMode === 'exact' ? (
                                <label>
                                    <span className="block text-xs opacity-70 mb-1">
                                        Mana Value
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={draft.cmc.exact ?? ''}
                                        onChange={e => updateCmc('exact', e.target.value)}
                                        placeholder="e.g. 3"
                                        className="w-full rounded-md p-2 bg-black/10 border border-[var(--bg-nav)]"
                                    />
                                </label>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <label className="flex-1">
                                        <span className="block text-xs opacity-70 mb-1">
                                            Minimum
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={draft.cmc.min ?? ''}
                                            onChange={e => updateCmc('min', e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-md p-2 bg-black/10 border border-[var(--bg-nav)]"
                                        />
                                    </label>

                                    <label className="flex-1">
                                        <span className="block text-xs opacity-70 mb-1">
                                            Maximum
                                        </span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={draft.cmc.max ?? ''}
                                            onChange={e => updateCmc('max', e.target.value)}
                                            placeholder="Any"
                                            className="w-full rounded-md p-2 bg-black/10 border border-[var(--bg-nav)]"
                                        />
                                    </label>
                                </div>
                            )}
                        </FilterGroup>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--bg-nav)]">
                        <button
                            type="button"
                            onClick={resetDraft}
                            className="text-sm opacity-70 hover:opacity-100"
                        >
                            Reset
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={applyFilters}
                                className="text-sm font-semibold px-4 py-2 rounded-md bg-[var(--app-secondary)] text-white hover:opacity-90"
                            >
                                Apply
                            </button>
                        </div>
                    </div>

                    <Popover.Arrow className="fill-[var(--app-accent)]" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
