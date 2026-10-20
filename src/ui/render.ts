import { MAX_MOVE, PLAYER_MAX_HP, POSTURE_LABELS } from "../config/constants";
import type { Game } from "../Game";
import type { Player } from "../Player";

export const getMapContainer = (): HTMLElement => {
    const container = document.getElementById("map");

    if (!container) {
        throw new Error("Conteneur #map introuvable dans la page.");
    }

    return container;
};

const findCellElement = (x: number, y: number): HTMLElement | null =>
    document.querySelector<HTMLElement>(`.map__cell[data-x="${x}"][data-y="${y}"]`);

const setText = (parent: ParentNode, selector: string, text: string): void => {
    const element = parent.querySelector(selector);

    if (element) {
        element.textContent = text;
    }
};

export const renderGame = (game: Game): void => {
    game.map.render(getMapContainer());
    highlightReachableCells(game);
    highlightActivePlayerCell(game);
    updatePlayerCards(game);
    updateTurnIndicator(game);
    updateCombatActions(game);
};

// Surligne les cases où le joueur actif peut se déplacer ce tour.
const highlightReachableCells = (game: Game): void => {
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

const highlightActivePlayerCell = (game: Game): void => {
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

// Fiches des joueurs : nom, PV, arme, posture, encadré du joueur actif.
const updatePlayerCards = (game: Game): void => {
    game.players.forEach((player: Player, index: number) => {
        const card = document.getElementById(`card-p${index + 1}`);
        if (!card) {
            return;
        }

        setText(card, ".player-card__name", player.name);
        setText(card, ".hp-value", String(player.hp));
        setText(card, ".weapon-value", player.weapon.name);
        setText(card, ".posture-value", POSTURE_LABELS[player.posture]);

        const hpFill = card.querySelector<HTMLElement>(".player-card__hp-fill");
        if (hpFill) {
            hpFill.style.width = `${(player.hp / PLAYER_MAX_HP) * 100}%`;
        }

        card.classList.toggle(
            "player-card--active",
            !game.isOver && game.currentPlayer === player
        );
    });
};

const updateTurnIndicator = (game: Game): void => {
    const indicator = document.getElementById("turn-indicator");
    if (!indicator) {
        return;
    }

    if (game.isOver) {
        indicator.textContent = game.winner
            ? `Partie terminée : ${game.winner.name} a gagné !`
            : "Partie terminée";
        return;
    }

    if (game.isInCombat) {
        indicator.textContent = `Combat ! ${game.currentPlayer.name} joue.`;
        return;
    }

    indicator.textContent =
        `Tour de ${game.currentPlayer.name} — ${game.movesLeft} case(s) restante(s) (1 à ${MAX_MOVE} cases)`;
};

const getButton = (id: string): HTMLButtonElement | null =>
    document.getElementById(id) as HTMLButtonElement | null;

const updateCombatActions = (game: Game): void => {
    const attackButton = getButton("attack-button");
    const postureButton = getButton("posture-button");
    const endTurnButton = getButton("end-turn-button");

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
export const addLog = (message: string): void => {
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
export const showGameOver = (winner: Player): void => {
    const overlay = document.getElementById("game-over");
    const title = document.getElementById("game-over-title");
    if (!overlay || !title) {
        return;
    }

    title.textContent = `${winner.name} A GAGNÉ !`;
    overlay.classList.remove("hidden");
};
