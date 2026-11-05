import { useEffect, useRef } from 'react';
import { NapsterCompanionApiSdk } from '@touchcastllc/napster-companion-api';
import '@touchcastllc/napster-companion-api/styles';

async function fetchToken() {
    const res = await fetch(import.meta.env.VITE_TOKEN_URL, { method: 'POST' });
    if (!res.ok) {
        throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
    }
    const { token } = await res.json();
    return token;
}

export default function CompanionWidget({ onEnd }) {
    const containerRef = useRef(null);
    const instanceRef = useRef(null);
    const onEndRef = useRef(onEnd);
    onEndRef.current = onEnd;

    useEffect(() => {
        let cancelled = false;

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
                        },
                    },
                    onDestroy: () => {
                        instanceRef.current = null;
                        if (!cancelled) onEndRef.current?.();
                    },
                });
                if (cancelled) {
                    instance.destroy();
                    return;
                }
                instanceRef.current = instance;
            } catch (err) {
                console.error(err);
                if (!cancelled) onEndRef.current?.();
            }
        })();

        return () => {
            cancelled = true;
            instanceRef.current?.destroy();
            instanceRef.current = null;
        };
    }, []);

    return <div ref={containerRef} style={{ width: '176px', height: '200px', position: 'absolute', bottom: 15, left: 15 }} />;
}
