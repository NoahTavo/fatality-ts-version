const getMapContainer = () => document.getElementById("map");

const findCellElement = (x, y) =>
    document.querySelector(`.map__cell[data-x="${x}"][data-y="${y}"]`);

const renderGame = (game) => {
    game.map.render(getMapContainer());
    highlightReachableCells(game);
    highlightActivePlayerCell(game);
    updatePlayerCards(game);
    updateTurnIndicator(game);
    updateCombatActions(game);
};

// Surligne les cases où le joueur actif peut se déplacer ce tour.
const highlightReachableCells = (game) => {
    document.querySelectorAll(".map__cell--movable")
        .forEach(element => element.classList.remove("map__cell--movable"));

    if (!game.isMoving) {
        return;
    }

    game.reachableCells.forEach(entry => {
        const element = findCellElement(entry.cell.x, entry.cell.y);
        if (element) {
            element.classList.add("map__cell--movable");
        }
    });
};

const highlightActivePlayerCell = (game) => {
    document.querySelectorAll(".map__cell--active")
        .forEach(element => element.classList.remove("map__cell--active"));

    if (game.isOver) {
        return;
    }

    const { x, y } = game.currentPlayer;
    const element = findCellElement(x, y);
    if (element) {
        element.classList.add("map__cell--active");
    }
};

// Fiches des joueurs : PV, arme, posture, encadré du joueur actif.
const updatePlayerCards = (game) => {
    game.players.forEach((player, index) => {
        const card = document.getElementById(`card-p${index + 1}`);
        if (!card) {
            return;
        }

        card.querySelector(".hp-value").textContent = player.hp;
        card.querySelector(".player-card__hp-fill").style.width =
            `${(player.hp / PLAYER_MAX_HP) * 100}%`;
        card.querySelector(".weapon-value").textContent = player.weapon.name;
        card.querySelector(".posture-value").textContent = POSTURE_LABELS[player.posture];

        card.classList.toggle(
            "player-card--active",
            !game.isOver && game.currentPlayer === player
        );
    });
};

const updateTurnIndicator = (game) => {
    const indicator = document.getElementById("turn-indicator");
    if (!indicator) {
        return;
    }

    if (game.isOver) {
        indicator.textContent = `Partie terminée : ${game.winner.name} a gagné !`;
        return;
    }

    if (game.isInCombat) {
        indicator.textContent = `Combat ! ${game.currentPlayer.name} joue.`;
        return;
    }

    indicator.textContent =
    `Tour de ${game.currentPlayer.name} — ${game.movesLeft} case(s) restante(s) (1 à ${MAX_MOVE} cases)`;
};

const updateCombatActions = (game) => {
    const attackButton = document.getElementById("attack-button");
    const postureButton = document.getElementById("posture-button");
    const endTurnButton = document.getElementById("end-turn-button");
    if (!attackButton || !postureButton) {
        return;
    }

    attackButton.disabled = !game.isInCombat;
    postureButton.disabled = !game.isInCombat;

    if (endTurnButton) {
        endTurnButton.disabled = !game.canEndTurn;
    }
};

// Journal de combat / de déplacement.
const addLog = (message) => {
    const log = document.getElementById("log");
    if (!log) {
        return;
    }

    const entry = document.createElement("p");
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
};

// Message de victoire.
const showGameOver = (winner) => {
    const overlay = document.getElementById("game-over");
    const title = document.getElementById("game-over-title");
    if (!overlay || !title) {
        return;
    }

    title.textContent = `${winner.name} A GAGNÉ !`;
    overlay.classList.remove("hidden");
};
