// Libs
import { useEffect, useRef, useState } from 'react';
import { NapsterCompanionApiSdk, DataChannelMessageType } from '@touchcastllc/napster-companion-api';
import '@touchcastllc/napster-companion-api/styles';

// Utils
import { exportDeck } from '../util/decklist';

async function fetchToken() {
    const res = await fetch(import.meta.env.VITE_TOKEN_URL, {
        method: 'POST'
    });

    if (!res.ok) {
        throw new Error(
            `Token request failed: ${res.status} ${await res.text()}`
        );
    }

    const { token } = await res.json();
    return token;
}

export default function CompanionWidget({ deck, setSearchQuery, onEnd, setFilters, setSearchSettings }) {
    const containerRef = useRef(null);
    const instanceRef = useRef(null);
    const endTimerRef = useRef(null);
    const onEndRef = useRef(onEnd);
    const deckRef = useRef(exportDeck(deck));
    const [isEnding, setIsEnding] = useState(false);

    // Keep refs synchronized with the latest props.
    onEndRef.current = onEnd;
    deckRef.current = exportDeck(deck);

    useEffect(() => {
        let cancelled = false;
        let sdkInstance = null;
        let agentReady = false;
        let greetingSent = false;

        const finishSession = () => {
            if (cancelled || endTimerRef.current) {
                return;
            }

            instanceRef.current = null;
            setIsEnding(true);
            endTimerRef.current = window.setTimeout(() => {
                endTimerRef.current = null;

                if (!cancelled) {
                    onEndRef.current?.();
                }
            }, 675);
        };

        const sendGreeting = () => {
            if (!sdkInstance || !agentReady || greetingSent || cancelled) {
                return;
            }

            greetingSent = true;

            sdkInstance.sendCommand({
                type: DataChannelMessageType.SEND_MESSAGE,
                data: {
                    text: "The session has just started. Please greet me naturally and welcome me to Upkeep.",
                    role: 'user',
                    trigger_response: true
                }
            });
        };

        const acknowledgeToolCall = (call_id, data) => {
            if (!sdkInstance || !agentReady || cancelled) {
                console.error('ABORTED: Cannot send function output');
                console.groupEnd();
                return;
            }

            const command = {
                type: DataChannelMessageType.FUNCTION_CALL_OUTPUT,
                data: {
                    call_id,
                    output: {
                        success: true,
                        data
                    },
                    delay: true
                }
            };

            try {
                sdkInstance.sendCommand(command);
            } catch (error) {
                console.error('sendCommand threw an error:', error);
            }
        };

        (async () => {
            try {
                const instance = await NapsterCompanionApiSdk.init(fetchToken, {
                    layout: {
                        type: 'inline',
                        mountContainer: containerRef.current
                    },
                    style: {
                        view: 'rectangle',
                        accentColor: '#C98B35'
                    },
                    features: {
                        disclaimer: {
                            enabled: false
                        },
                        screenShare: {
                            enabled: true
                        }
                    },

                    // Wait for the actual agent connection.
                    onData: (message) => {
                        if (
                            message.event === 'avatar_state_changed' &&
                            message.data?.state === 'ready'
                        ) {
                            agentReady = true;
                            sendGreeting();
                        } else if (
                            message.event === 'function_implicitly_called'
                        ) {
                            if (message.data.name === 'return_card_name') {
                                setFilters({});
                                setSearchSettings({
                                    strictSearch: true,
                                    searchKeys: ['name']
                                });
                                setSearchQuery(
                                    message.data.arguments.card_name
                                );
                                acknowledgeToolCall(
                                    message.data.call_id,
                                    message.data.arguments.card_name
                                );
                            } else if (
                                message.data.name === 'review_deck'
                            ) {
                                acknowledgeToolCall(
                                    message.data.call_id,
                                    deckRef.current
                                );
                            }
                        }
                    },

                    onDestroy: () => {
                        finishSession();
                    }
                });

                if (cancelled) {
                    instance.destroy();
                    return;
                }

                sdkInstance = instance;
                instanceRef.current = instance;

                // Handles the unlikely case that ready arrived
                // before init() finished resolving.
                sendGreeting();

            } catch (err) {
                console.error(err);

                if (!cancelled) {
                    onEndRef.current?.();
                }
            }
        })();

        return () => {
            cancelled = true;
            window.clearTimeout(endTimerRef.current);
            endTimerRef.current = null;
            instanceRef.current?.destroy();
            instanceRef.current = null;
        };
    }, []);

    return (
        <div
            className={`companion-card${isEnding ? ' companion-card--ending' : ''}`}
            role="region"
            aria-label="Dex companion"
        >
            <div className="companion-portal" aria-hidden="true">
                <div className="companion-portal__core" />
                <div className="companion-portal__ring companion-portal__ring--outer" />
                <div className="companion-portal__ring companion-portal__ring--inner" />
                <div className="companion-portal__sparks" />
            </div>
            {isEnding && (
                <div className="companion-portal companion-portal--reverse" aria-hidden="true">
                    <div className="companion-portal__core" />
                    <div className="companion-portal__ring companion-portal__ring--outer" />
                    <div className="companion-portal__ring companion-portal__ring--inner" />
                    <div className="companion-portal__sparks" />
                </div>
            )}
            <div className="companion-card__foil" aria-hidden="true" />
            <div className="companion-card__art" ref={containerRef} />
            <div className="companion-card__corner companion-card__corner--top" aria-hidden="true" />
            <div className="companion-card__corner companion-card__corner--bottom" aria-hidden="true" />
        </div>
    );
}
