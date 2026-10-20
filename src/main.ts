import { GRID_COLUMNS, GRID_ROWS, MAX_WEAPONS, OBSTACLE_RATE, PLAYER1_STORAGE_KEY, PLAYER2_STORAGE_KEY } from "./config/constants";
import { Game } from "./Game";
import { GameMap } from "./GameMap";
import { PlayerManager } from "./PlayerManager";
import { getMapContainer } from "./ui/render";

declare global {
    interface Window {
        game?: Game;
    }
}

// index.html ouvert sans passage par le menu : pose une sélection par défaut.
const ensureCharactersSelected = (): void => {
    const manager = new PlayerManager();

    if (manager.selectedPlayers.length < 2) {
        const [first, second] = manager.players;

        localStorage.setItem(PLAYER1_STORAGE_KEY, first.file);
        localStorage.setItem(PLAYER2_STORAGE_KEY, second.file);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ensureCharactersSelected();

    const map = new GameMap(GRID_COLUMNS, GRID_ROWS, OBSTACLE_RATE, MAX_WEAPONS);
    const game = new Game(map, map.players);
    window.game = game; // pratique pour le débogage dans la console

    game.start();

    // Clavier : flèches pour se déplacer, A pour attaquer, P pour la posture,
    // Entrée pour terminer le tour.
    document.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key in Game.KEY_DIRECTIONS) {
            event.preventDefault();
        }

        game.handleKey(event.key);
    });

    // Boutons d'action (mêmes actions que les touches).
    document.getElementById("attack-button")?.addEventListener("click", () => game.attack());
    document.getElementById("posture-button")?.addEventListener("click", () => game.togglePosture());
    document.getElementById("end-turn-button")?.addEventListener("click", () => game.endTurnManually());

    // Clic sur une case surlignée pour s'y déplacer.
    getMapContainer().addEventListener("click", (event: MouseEvent) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const cellElement = event.target.closest<HTMLElement>(".map__cell");
        if (!cellElement) {
            return;
        }

        const x = Number(cellElement.dataset.x);
        const y = Number(cellElement.dataset.y);
        game.moveToCell(game.map.getCell(x, y));
    });
});
