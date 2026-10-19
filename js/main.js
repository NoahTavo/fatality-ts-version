// index.html ouvert sans passage par le menu : pose une sélection par défaut.
const ensureCharactersSelected = () => {
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
    document.addEventListener("keydown", (event) => {
        if (Object.keys(Game.KEY_DIRECTIONS).includes(event.key)) {
            event.preventDefault();
        }

        game.handleKey(event.key);
    });

    // Boutons d'action (mêmes actions que les touches).
    document.getElementById("attack-button").addEventListener("click", () => game.attack());
    document.getElementById("posture-button").addEventListener("click", () => game.togglePosture());
    document.getElementById("end-turn-button").addEventListener("click", () => game.endTurnManually());
    // Clic sur une case surlignée pour s'y déplacer.
    getMapContainer().addEventListener("click", (event) => {
        const cellElement = event.target.closest(".map__cell");
        if (!cellElement) {
            return;
        }

        const x = Number(cellElement.dataset.x);
        const y = Number(cellElement.dataset.y);
        game.moveToCell(game.map.getCell(x, y));
    });
});
