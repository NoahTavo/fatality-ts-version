import {
    PLAYER1_STORAGE_KEY,
    PLAYER2_STORAGE_KEY,
    PLAYER_FILES,
    isPlayerFile,
    type PlayerFile
} from "../config/constants";
import { Player } from "./Player";

// Seules les méthodes utilisées sont exigées : facile à remplacer par un faux stockage dans les tests.
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type PlayerSelection = readonly [PlayerFile, PlayerFile];

// Accès aux personnages et à la sélection faite dans le menu (remplace PlayerManager).
// C'est la seule classe du projet qui connaît localStorage.
export class PlayerRepository {
    private readonly _storage: StorageLike;

    constructor(storage: StorageLike = localStorage) {
        this._storage = storage;
    }

    // Nouvelles instances à chaque appel : les deux joueurs peuvent avoir le même personnage.
    get allPlayers(): Player[] {
        return PLAYER_FILES.map(file => new Player(file));
    }

    loadSelection(): PlayerSelection | null {
        const first = this._storage.getItem(PLAYER1_STORAGE_KEY);
        const second = this._storage.getItem(PLAYER2_STORAGE_KEY);

        return isPlayerFile(first) && isPlayerFile(second) ? [first, second] : null;
    }

    saveSelection([first, second]: PlayerSelection): void {
        this._storage.setItem(PLAYER1_STORAGE_KEY, first);
        this._storage.setItem(PLAYER2_STORAGE_KEY, second);
    }

    // index.html ouvert sans passer par le menu : sélection par défaut.
    ensureSelection(): PlayerSelection {
        const existing = this.loadSelection();
        if (existing) {
            return existing;
        }

        const fallback: PlayerSelection = [PLAYER_FILES[0], PLAYER_FILES[1]];
        this.saveSelection(fallback);
        return fallback;
    }

    createSelectedPlayers(): Player[] {
        const [first, second] = this.ensureSelection();
        return [new Player(first), new Player(second)];
    }
}
