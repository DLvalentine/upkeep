
import { useEffect, useRef } from 'react';
import {
    NapsterCompanionApiSdk,
    DataChannelMessageType
} from '@touchcastllc/napster-companion-api';
import '@touchcastllc/napster-companion-api/styles';
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
    const onEndRef = useRef(onEnd);
    const deckRef = useRef(exportDeck(deck));

    // Keep refs synchronized with the latest props.
    onEndRef.current = onEnd;
    deckRef.current = exportDeck(deck);

    useEffect(() => {
        let cancelled = false;
        let sdkInstance = null;
        let agentReady = false;
        let greetingSent = false;

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
                        instanceRef.current = null;

                        if (!cancelled) {
                            onEndRef.current?.();
                        }
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
            instanceRef.current?.destroy();
            instanceRef.current = null;
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '176px',
                height: '200px',
                position: 'absolute',
                bottom: 15,
                left: 15,
                zIndex: '9999'
            }}
        />
    );
}
