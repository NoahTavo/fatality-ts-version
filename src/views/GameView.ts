import { GAME_PHASES, MAX_MOVE } from "../config/constants";
import type { GameReadModel } from "../models/GameModel";
import type { Player } from "../models/Player";
import type { Position } from "../models/types";
import { assertNever } from "../utils/assertNever";
import { requireElement } from "./dom";
import { MapView } from "./MapView";
import { PlayerCardView } from "./PlayerCardView";

// Ce que le contrôleur fournit à la vue : la vue signale « l'utilisateur a cliqué »,
// elle ne décide jamais de ce qui se passe ensuite.
export interface GameViewHandlers {
    onAttack(): void;
    onPosture(): void;
    onEndTurn(): void;
    onCellClick(position: Position): void;
}

export class GameView {
    private readonly _mapView = new MapView();
    private readonly _cards = [new PlayerCardView("card-p1"), new PlayerCardView("card-p2")];

    private readonly _turnIndicator = requireElement("turn-indicator", HTMLElement);
    private readonly _log = requireElement("log", HTMLElement);
    private readonly _attackButton = requireElement("attack-button", HTMLButtonElement);
    private readonly _postureButton = requireElement("posture-button", HTMLButtonElement);
    private readonly _endTurnButton = requireElement("end-turn-button", HTMLButtonElement);
    private readonly _gameOverOverlay = requireElement("game-over", HTMLElement);
    private readonly _gameOverTitle = requireElement("game-over-title", HTMLElement);

    bind(handlers: GameViewHandlers): void {
        this._attackButton.addEventListener("click", () => handlers.onAttack());
        this._postureButton.addEventListener("click", () => handlers.onPosture());
        this._endTurnButton.addEventListener("click", () => handlers.onEndTurn());
        this._mapView.onCellClick(position => handlers.onCellClick(position));
    }

    render(game: GameReadModel): void {
        this._mapView.render(game);
        this.renderPlayerCards(game);
        this._turnIndicator.textContent = this.describeTurn(game);
        this.renderActions(game);
    }

    // Journal de combat / de déplacement.
    addLog(message: string): void {
        const entry = document.createElement("p");
        entry.textContent = message;
        this._log.appendChild(entry);
        this._log.scrollTop = this._log.scrollHeight;
    }

    showGameOver(winner: Player): void {
        this._gameOverTitle.textContent = `${winner.name} A GAGNÉ !`;
        this._gameOverOverlay.classList.remove("hidden");
    }

    private renderPlayerCards(game: GameReadModel): void {
        const isGameOver = game.state.phase === GAME_PHASES.OVER;

        game.players.forEach((player, index) => {
            this._cards[index]?.render(player, !isGameOver && game.currentPlayer === player);
        });
    }

    private renderActions(game: GameReadModel): void {
        const isInCombat = game.state.phase === GAME_PHASES.COMBAT;

        this._attackButton.disabled = !isInCombat;
        this._postureButton.disabled = !isInCombat;
        this._endTurnButton.disabled = !game.canEndTurn;
    }

    // switch exhaustif sur l'union discriminée : ajouter une phase sans la traiter ici ne compile plus.
    private describeTurn(game: GameReadModel): string {
        const { state, currentPlayer } = game;

        switch (state.phase) {
            case GAME_PHASES.OVER:
                return `Partie terminée : ${state.winner.name} a gagné !`;
            case GAME_PHASES.COMBAT:
                return `Combat ! ${currentPlayer.name} joue.`;
            case GAME_PHASES.MOVING:
                return `Tour de ${currentPlayer.name} — ${state.movesLeft} case(s) restante(s) (1 à ${MAX_MOVE} cases)`;
            default:
                return assertNever(state);
        }
    }
}
