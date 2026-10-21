import { GAME_PHASES } from "../config/constants";
import type { Cell } from "../models/Cell";
import type { GameReadModel } from "../models/GameModel";
import type { Player } from "../models/Player";
import type { Position } from "../models/types";
import { requireElement } from "./dom";

// Dessine la grille. Ne modifie jamais le modèle : il lit et affiche.
export class MapView {
    private readonly _container = requireElement("map", HTMLElement);

    render(game: GameReadModel): void {
        const { map, state } = game;

        const reachable: ReadonlySet<Cell> = state.phase === GAME_PHASES.MOVING
            ? new Set(state.reachableCells.map(entry => entry.cell))
            : new Set<Cell>();
        const activePlayer = state.phase === GAME_PHASES.OVER ? null : game.currentPlayer;

        this._container.style.display = "grid";
        this._container.style.gridTemplateColumns = `repeat(${map.columns}, minmax(0, 1fr))`;
        this._container.style.gridTemplateRows = `repeat(${map.rows}, minmax(0, 1fr))`;

        this._container.replaceChildren(
            ...map.grid.map(cell => this.createCell(game, cell, reachable, activePlayer))
        );
    }

    // Le contrôleur fournit la réaction ; la vue ne sait pas ce qu'elle déclenche.
    onCellClick(handler: (position: Position) => void): void {
        this._container.addEventListener("click", event => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const cellElement = event.target.closest<HTMLElement>(".map__cell");
            if (!cellElement) {
                return;
            }

            handler({ x: Number(cellElement.dataset.x), y: Number(cellElement.dataset.y) });
        });
    }

    private createCell(
        game: GameReadModel,
        cell: Cell,
        reachable: ReadonlySet<Cell>,
        activePlayer: Player | null
    ): HTMLDivElement {
        const element = document.createElement("div");
        element.classList.add("map__cell");
        element.dataset.x = String(cell.x);
        element.dataset.y = String(cell.y);
        element.dataset.testid = `map-cell-${cell.x}-${cell.y}`;

        element.classList.toggle("map__cell--obstacle", cell.isObstacle);
        element.classList.toggle("map__cell--movable", reachable.has(cell));
        element.classList.toggle(
            "map__cell--active",
            activePlayer !== null && activePlayer.x === cell.x && activePlayer.y === cell.y
        );

        const player = game.map.getPlayerAt(cell.x, cell.y);
        const weapon = game.map.getWeaponAt(cell.x, cell.y);

        // Le joueur est affiché par-dessus une éventuelle arme au sol.
        if (player) {
            element.classList.add("map__cell--personnage");
            element.appendChild(this.createSprite(player.path, player.name));
        } else if (weapon) {
            element.classList.add("map__cell--arme");
            element.appendChild(this.createSprite(weapon.icon, weapon.name));
        }

        return element;
    }

    private createSprite(src: string, alt: string): HTMLImageElement {
        const image = document.createElement("img");
        image.classList.add("map__cell-sprite");
        image.src = src;
        image.alt = alt;
        return image;
    }
}
