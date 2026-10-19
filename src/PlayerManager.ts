import { PLAYER1_STORAGE_KEY, PLAYER2_STORAGE_KEY, PLAYER_FILES } from "./config/constants";
import { Player } from "./Player";

export class PlayerManager {
    private readonly _players: Player[];

    constructor() {
        this._players = PLAYER_FILES.map(file => new Player(file));
    }

    get players(): Player[] {
        return this._players;
    }

    findPlayer(file: string | null): Player | undefined {
        return this.players.find(player => player.file === file);
    }

    // Joueurs choisis dans le menu (joueur 1 puis joueur 2).
    // Nouvelle instance à chaque fois : les deux joueurs peuvent avoir le même personnage.
    get selectedPlayers(): Player[] {
        return [PLAYER1_STORAGE_KEY, PLAYER2_STORAGE_KEY]
            .map(key => localStorage.getItem(key))
            .filter((file): file is string => this.findPlayer(file) !== undefined)
            .map(file => new Player(file));
    }
}