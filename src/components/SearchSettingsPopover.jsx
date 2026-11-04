
// Libs
import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Settings2, X } from 'lucide-react';

// Utils
import { suppressCardHover } from '../util/hoverManager';

const SEARCH_KEY_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'oracle_text', label: 'Oracle Text' },
    { value: 'type_line', label: 'Type Line' },
];

const DEFAULT_SORT_KEY = 'edhrec_rank';

const SORT_KEY_OPTIONS = [
    { value: 'edhrec_rank', label: 'EDHREC Rank' },
    { value: 'name', label: 'Name' },
    { value: 'toughness', label: 'Toughness' },
    { value: 'power', label: 'Power' },
    { value: 'cmc', label: 'Mana Value' },
];

function normalizeSettings(settings = {}) {
    return {
        strictSearch: settings.strictSearch ?? true,
        searchKeys: Array.isArray(settings.searchKeys)
            ? [...settings.searchKeys]
            : ['name'],
    };
}

export default function SearchSettingsPopover({
    settings,
    onApply,
    sortKey,
    onSortKeyChange,
}) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(() =>
        normalizeSettings(settings)
    );
    const [draftSortKey, setDraftSortKey] = useState(sortKey);

    // Restore applied settings whenever the popover opens.
    useEffect(() => {
        if (open) {
            setDraft(normalizeSettings(settings));
            setDraftSortKey(sortKey);
        }
    }, [open, settings, sortKey]);

    const toggleSearchKey = (value) => {
        setDraft(current => ({
            ...current,
            searchKeys: current.searchKeys.includes(value)
                ? current.searchKeys.filter(key => key !== value)
                : [...current.searchKeys, value]
        }));
    };

    const resetDraft = () => {
        const defaults = normalizeSettings();
        setDraft(defaults);
        setDraftSortKey(DEFAULT_SORT_KEY);
        onApply(defaults);
        onSortKeyChange(DEFAULT_SORT_KEY);
        setOpen(false);
    };

    const applySettings = () => {
        onApply(normalizeSettings(draft));
        onSortKeyChange(draftSortKey);
    };

    const closeAndApply = () => {
        applySettings();
        suppressCardHover(400);
        setOpen(false);
    };

    const hasCustomSettings =
        draft.strictSearch !== true ||
        draft.searchKeys.length !== 1 ||
        draft.searchKeys[0] !== 'name' ||
        draftSortKey !== DEFAULT_SORT_KEY;

    return (
        <Popover.Root
            open={open}
            onOpenChange={nextOpen => {
                if (!nextOpen) {
                    closeAndApply();
                    return;
                }

                setOpen(true);
            }}
        >
            <Popover.Trigger asChild>
                <button
                    type="button"
                    aria-label="Search settings"
                    title="Search settings"
                    className="relative flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-secondary)]"
                >
                    <Settings2
                        size={24}
                        style={{ color: 'var(--app-secondary)' }}
                    />

                    {hasCustomSettings && (
                        <span className="
                            absolute -top-1.5 -right-1.5
                            w-2.5 h-2.5 rounded-full
                            bg-[var(--app-secondary)]
                        " />
                    )}
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    side="bottom"
                    align="start"
                    sideOffset={10}
                    collisionPadding={12}
                    className="
                        z-50 w-80 max-h-[80vh] overflow-y-auto
                        rounded-lg border border-[var(--bg-nav)]
                        bg-[var(--app-panel)] text-[var(--app-text)]
                        shadow-xl p-4
                    "
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            <Settings2 size={18} />
                            <h3 className="font-semibold">
                                Search Settings
                            </h3>
                        </div>

                        <Popover.Close asChild>
                            <button
                                type="button"
                                aria-label="Close settings"
                                className="opacity-60 hover:opacity-100"
                            >
                                <X size={18} />
                            </button>
                        </Popover.Close>
                    </div>

                    <div className="flex flex-col gap-5">

                        {/* Matching Behavior */}
                        <section className="flex flex-col gap-2">
                            <h4 className="text-sm font-semibold">
                                Matching Behavior
                            </h4>

                            <label className="
                                flex items-center justify-between
                                gap-3 cursor-pointer text-sm
                                rounded-md p-2 hover:bg-black/10
                            ">
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">
                                        Strict Search
                                    </span>
                                    <span className="text-xs opacity-60">
                                        Require stricter query matching
                                    </span>
                                </div>

                                <input
                                    type="checkbox"
                                    checked={draft.strictSearch}
                                    onChange={e =>
                                        setDraft(current => ({
                                            ...current,
                                            strictSearch: e.target.checked
                                        }))
                                    }
                                />
                            </label>
                        </section>

                        <div className="border-t border-[var(--bg-nav)]" />

                        {/* Sort Order */}
                        <section className="flex flex-col gap-2">
                            <label
                                htmlFor="sort-key"
                                className="text-sm font-semibold"
                            >
                                Sort By
                            </label>

                            <select
                                id="sort-key"
                                value={draftSortKey}
                                onChange={event =>
                                    setDraftSortKey(event.target.value)
                                }
                                className="rounded-md border border-[var(--bg-nav)] bg-black/10 p-2 text-sm"
                            >
                                {SORT_KEY_OPTIONS.map(option => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </section>

                        <div className="border-t border-[var(--bg-nav)]" />

                        {/* Search Fields */}
                        <section className="flex flex-col gap-2">
                            <h4 className="text-sm font-semibold">
                                Search Fields
                            </h4>

                            <p className="text-xs opacity-60">
                                Choose which card properties are included
                                in searches.
                            </p>

                            <div className="flex flex-col gap-2">
                                {SEARCH_KEY_OPTIONS.map(option => (
                                    <label
                                        key={option.value}
                                        className="
                                            flex items-center gap-2
                                            text-sm cursor-pointer
                                            rounded-md px-2 py-1.5
                                            hover:bg-black/10
                                        "
                                    >
                                        <input
                                            type="checkbox"
                                            checked={draft.searchKeys.includes(
                                                option.value
                                            )}
                                            onChange={() =>
                                                toggleSearchKey(option.value)
                                            }
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="
                        flex items-center justify-between
                        mt-6 pt-4 border-t border-[var(--bg-nav)]
                    ">
                        <button
                            type="button"
                            onClick={resetDraft}
                            className="text-sm opacity-70 hover:opacity-100"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            onClick={closeAndApply}
                            className="
                                text-sm font-semibold px-4 py-2
                                rounded-md bg-[var(--app-secondary)]
                                text-white hover:opacity-90
                            "
                        >
                            Apply
                        </button>
                    </div>

                    <Popover.Arrow className="fill-[var(--app-accent)]" />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
