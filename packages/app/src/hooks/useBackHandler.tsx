import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

interface BackHandlerContextType {
    register: (id: string, handler: () => boolean | Promise<boolean>) => void;
    unregister: (id: string) => void;
}

const BackHandlerContext = createContext<BackHandlerContextType>({
    register: () => { },
    unregister: () => { }
});

export const BackHandlerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const handlersRef = useRef<Map<string, () => boolean | Promise<boolean>>>(new Map());

    const register = useCallback((id: string, handler: () => boolean | Promise<boolean>) => {
        handlersRef.current.set(id, handler);
    }, []);

    const unregister = useCallback((id: string) => {
        handlersRef.current.delete(id);
    }, []);

    useEffect(() => {
        const listener = CapacitorApp.addListener('backButton', async () => {
            // Execute handlers in reverse order of registration (LIFO-ish assumption, but Map iteration is insertion order)
            // Actually, we want the *most recently registered* or *most specific* handler to intercept.
            // Since it's a map, we can iterate values. But insertion order is preserved.
            // A better approach might be a stack array, but Map is fine if we reverse.
            // Or we let components manage priority?
            // Simple LIFO: Iterate backwards.
            const handlers = Array.from(handlersRef.current.entries());
            let handled = false;

            for (let i = handlers.length - 1; i >= 0; i--) {
                const [, handler] = handlers[i];
                if (await handler()) {
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                // If no handler intercepted, maybe minimize app or let default happen?
                // Capacitor default is minimize or exit.
                // We can explicitly exit if on root view?
            }
        });

        return () => {
            listener.then(handle => handle.remove());
        };
    }, []);

    return (
        <BackHandlerContext.Provider value={{ register, unregister }}>
            {children}
        </BackHandlerContext.Provider>
    );
};

export const useBackHandler = (id: string, handler: () => boolean | Promise<boolean>, enabled: boolean = true) => {
    const { register, unregister } = useContext(BackHandlerContext);

    useEffect(() => {
        if (enabled) {
            register(id, handler);
        } else {
            unregister(id);
        }
        return () => unregister(id);
    }, [id, handler, enabled, register, unregister]);
};
