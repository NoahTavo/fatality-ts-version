import { GameController } from "./controllers/GameController";
import { GRID_COLUMNS, GRID_ROWS, MAX_WEAPONS, OBSTACLE_RATE } from "./config/constants";
import { WEAPON_TYPES } from "./config/Weapons";
import { GameMap } from "./models/GameMap";
import { GameModel } from "./models/GameModel";
import { PlayerRepository } from "./models/PlayerRepository";
import { GameView } from "./views/GameView";

declare global {
    interface Window {
        game?: GameModel;
    }
}

// Point d'entrée : c'est ici  que l'on assemble Modèle, Vue et Contrôleur.
document.addEventListener("DOMContentLoaded", () => {
    const players = new PlayerRepository().createSelectedPlayers();

    const map = new GameMap(
        { columns: GRID_COLUMNS, rows: GRID_ROWS, obstacleRate: OBSTACLE_RATE, maxWeapons: MAX_WEAPONS },
        players,
        WEAPON_TYPES
    );

    const model = new GameModel(map);
    window.game = model; // pratique pour le débogage dans la console

    new GameController(model, new GameView()).start();
});
