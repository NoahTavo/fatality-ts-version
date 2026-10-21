type Listener<Payload> = (payload: Payload) => void;

// Émetteur d'événements générique et fortement typé.
// `Events` associe chaque nom d'événement au type de sa donnée
export class TypedEventEmitter<Events extends object> {
    private readonly _listeners = new Map<keyof Events, Set<(payload: never) => void>>();

    // Retourne une fonction de désinscription.
    on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
        const listeners = this._listeners.get(event) ?? new Set<(payload: never) => void>();
        listeners.add(listener);
        this._listeners.set(event, listeners);

        return () => {
            listeners.delete(listener);
        };
    }

    protected emit<K extends keyof Events>(event: K, payload: Events[K]): void {
        this._listeners.get(event)?.forEach(listener => {
            (listener as Listener<Events[K]>)(payload);
        });
    }
}
