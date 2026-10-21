import { GAME_PHASES, type DirectionName } from "../config/constants";
import type { GameModel } from "../models/GameModel";
import { assertNever } from "../utils/assertNever";
import type { GameView } from "../views/GameView";

const ARROW_KEYS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right"
} as const;

type ArrowKey = keyof typeof ARROW_KEYS;

// Garde de type : `key` devient ArrowKey, donc ARROW_KEYS[key] est typé DirectionName sans cast.
const isArrowKey = (key: string): key is ArrowKey =>
    Object.prototype.hasOwnProperty.call(ARROW_KEYS, key);

// Le contrôleur est le seul à connaître le modèle ET la vue :
//   entrées utilisateur  ->  actions du modèle
//   événements du modèle ->  mises à jour de la vue
export class GameController {
    private readonly _model: GameModel;
    private readonly _view: GameView;

    constructor(model: GameModel, view: GameView) {
        this._model = model;
        this._view = view;
    }

    start(): void {
        this.listenToModel();
        this.listenToView();
        document.addEventListener("keydown", this.onKeyDown);

        this._model.start();
    }

    // ----- Modèle -> Vue -----
    private listenToModel(): void {
        this._model.on("changed", () => this._view.render(this._model));
        this._model.on("log", message => this._view.addLog(message));
        this._model.on("gameOver", winner => this._view.showGameOver(winner));
    }

    // ----- Vue -> Modèle -----
    private listenToView(): void {
        this._view.bind({
            onAttack: () => this._model.attack(),
            onPosture: () => this._model.togglePosture(),
            onEndTurn: () => this._model.endTurnManually(),
            onCellClick: ({ x, y }) => this._model.moveToCell(this._model.map.getCell(x, y))
        });
    }

    // Clavier : flèches pour se déplacer, A pour attaquer, P pour la posture, Entrée pour finir le tour.
    private readonly onKeyDown = (event: KeyboardEvent): void => {
        if (isArrowKey(event.key)) {
            event.preventDefault();
        }

        this.dispatchKey(event.key);
    };

    private dispatchKey(key: string): void {
        const { state } = this._model;

        switch (state.phase) {
            case GAME_PHASES.OVER:
                return;
            case GAME_PHASES.COMBAT:
                this.handleCombatKey(key);
                return;
            case GAME_PHASES.MOVING:
                this.handleMovingKey(key);
                return;
            default:
                assertNever(state);
        }
    }

    private handleCombatKey(key: string): void {
        switch (key.toLowerCase()) {
            case "a":
                this._model.attack();
                break;
            case "p":
                this._model.togglePosture();
                break;
        }
    }

    private handleMovingKey(key: string): void {
        if (key === "Enter") {
            this._model.endTurnManually();
            return;
        }

        if (isArrowKey(key)) {
            const direction: DirectionName = ARROW_KEYS[key];
            this._model.moveByDirection(direction);
        }
    }
}
