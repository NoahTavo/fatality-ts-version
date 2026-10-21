import {
    DEFENSE_DAMAGE_MULTIPLIER,
    DIRECTIONS,
    DIRECTION_NAMES,
    GAME_PHASES,
    MAX_MOVE,
    PLAYERS_COUNT,
    POSTURES,
    POSTURE_LABELS,
    type DirectionName
} from "../config/constants";
import { DEFAULT_WEAPON } from "../config/Weapons";
import { TypedEventEmitter } from "../utils/TypedEventEmitter";
import type { Cell } from "./Cell";
import type { GameMap } from "./GameMap";
import type { Player } from "./Player";
import type { Position } from "./types";

// ======================================================================
// État de la partie : UNION DISCRIMINÉE sur `phase`.
// Chaque phase ne porte que les données qui ont un sens pour elle :
// impossible de lire `winner` en phase MOVING ou `movesLeft` en phase OVER.
// ======================================================================

// Une case atteignable ce tour, avec le chemin complet pour y arriver.
export interface ReachableEntry {
    readonly cell: Cell;
    readonly path: readonly Cell[];
}

interface TurnProgress {
    readonly movesLeft: number;
    readonly lockedDirection: DirectionName | null; // direction choisie pour ce tour (null = pas encore bougé)
}

export interface MovingState extends TurnProgress {
    readonly phase: typeof GAME_PHASES.MOVING;
    readonly reachableCells: readonly ReachableEntry[];
}

export interface CombatState {
    readonly phase: typeof GAME_PHASES.COMBAT;
}

export interface OverState {
    readonly phase: typeof GAME_PHASES.OVER;
    readonly winner: Player;
}

export type GameState = MovingState | CombatState | OverState;

// Événements émis par le modèle : la vue et le contrôleur s'y abonnent (pattern Observer).
export type GameEvents = {
    changed: undefined;   // l'état a changé : la vue doit se redessiner
    log: string;          // nouveau message pour le journal
    gameOver: Player;     // la partie est terminée
};

// ======================================================================
// Modèle du jeu : toutes les règles, aucune ligne de DOM.
// ======================================================================
export class GameModel extends TypedEventEmitter<GameEvents> {
    private readonly _map: GameMap;
    private readonly _players: readonly Player[];
    private _currentPlayerIndex = 0; // le joueur 1 commence toujours
    private _state: GameState;

    constructor(map: GameMap) {
        super();

        if (map.players.length < PLAYERS_COUNT) {
            throw new Error("Impossible de placer les deux joueurs sur la carte.");
        }

        this._map = map;
        this._players = map.players;
        this._state = this.createMovingState({ movesLeft: MAX_MOVE, lockedDirection: null });
    }

    // ----- Lecture -----

    get map(): GameMap {
        return this._map;
    }

    get players(): readonly Player[] {
        return this._players;
    }

    get state(): GameState {
        return this._state;
    }

    get currentPlayer(): Player {
        return this._players[this._currentPlayerIndex];
    }

    get opponent(): Player {
        return this._players[(this._currentPlayerIndex + 1) % this._players.length];
    }

    // Le joueur doit avoir avancé d'au moins 1 case avant de passer la main.
    get canEndTurn(): boolean {
        return this._state.phase === GAME_PHASES.MOVING && this._state.movesLeft < MAX_MOVE;
    }

    private get arePlayersAdjacent(): boolean {
        const [first, second] = this._players;

        return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
    }

    // ----- Cycle de vie -----

    start(): void {
        this.log(`${this.currentPlayer.name} commence la partie !`);
        this.notify();
    }

    // ==================================================================
    // Phase de déplacement (MOVING)
    // ==================================================================

    // Déplacement d'une case. Changer de direction pendant un déplacement est interdit.
    moveByDirection(directionName: DirectionName): void {
        const state = this._state;
        if (state.phase !== GAME_PHASES.MOVING) {
            return;
        }

        if (state.lockedDirection !== null && state.lockedDirection !== directionName) {
            this.log("Changement de direction interdit pendant un déplacement.");
            this.notify();
            return;
        }

        const player = this.currentPlayer;
        const { dx, dy } = DIRECTIONS[directionName];
        const cell = this._map.getCell(player.x + dx, player.y + dy);

        if (!this.canMoveTo(cell)) {
            this.log("Déplacement impossible : case bloquée ou hors carte.");
            this.notify();
            return;
        }

        const progress = this.stepTo(player, cell, state);

        if (this.arePlayersAdjacent) {
            this.startCombat();
            return;
        }

        this.continueTurn(progress);
    }

    // Déplacement au clic : le joueur suit le chemin complet jusqu'à la case ciblée,
    // puis le tour passe directement à l'adversaire.
    moveToCell(targetCell: Cell | null): void {
        const state = this._state;
        if (state.phase !== GAME_PHASES.MOVING || !targetCell) {
            return;
        }

        const target = state.reachableCells.find(entry => entry.cell === targetCell);
        if (!target) {
            return;
        }

        const player = this.currentPlayer;
        let progress: TurnProgress = state;

        for (const cell of target.path) {
            progress = this.stepTo(player, cell, progress);

            if (this.arePlayersAdjacent) {
                this.startCombat();
                return;
            }
        }

        this.endTurn();
    }

    endTurnManually(): void {
        if (this._state.phase !== GAME_PHASES.MOVING) {
            return;
        }

        if (!this.canEndTurn) {
            this.log(`${this.currentPlayer.name} doit se déplacer d'au moins 1 case.`);
            this.notify();
            return;
        }

        this.endTurn();
    }

    private canMoveTo(cell: Cell | null): cell is Cell {
        return cell !== null && !cell.isObstacle && !this._map.getPlayerAt(cell.x, cell.y);
    }

    // Un pas : déplace le joueur, ramasse une éventuelle arme, consomme un point de déplacement
    // et verrouille la direction du tour. Retourne la nouvelle progression (aucune mutation d'état).
    private stepTo(player: Player, cell: Cell, progress: TurnProgress): TurnProgress {
        const lockedDirection = this.directionBetween(player.position, cell);

        player.position = { x: cell.x, y: cell.y };
        this.pickUpWeapon(player, cell);

        return { movesLeft: progress.movesLeft - 1, lockedDirection };
    }

    private directionBetween(from: Position, to: Cell): DirectionName | null {
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        return DIRECTION_NAMES.find(name => DIRECTIONS[name].dx === dx && DIRECTIONS[name].dy === dy) ?? null;
    }

    // Ramassage : le joueur échange son arme contre celle au sol,
    // et l'ancienne arme reste sur la case (sauf les poings).
    private pickUpWeapon(player: Player, cell: Cell): void {
        const picked = this._map.getWeaponAt(cell.x, cell.y);
        if (!picked) {
            return;
        }

        const dropped = player.weapon;

        this._map.removeWeapon(picked);
        player.weapon = picked;

        if (dropped !== DEFAULT_WEAPON) {
            this._map.addWeapon(dropped, cell.x, cell.y);
            this.log(`${player.name} échange ${dropped.name} contre ${picked.name} (${picked.damage} dégâts).`);
        } else {
            this.log(`${player.name} ramasse ${picked.name} (${picked.damage} dégâts).`);
        }
    }

    // Après chaque pas : le tour se termine tout seul s'il ne reste plus
    // de déplacement OU si le joueur est bloqué par un obstacle.
    private continueTurn(progress: TurnProgress): void {
        const next = this.createMovingState(progress);
        const isBlocked = next.reachableCells.length === 0;

        if (progress.movesLeft <= 0 || isBlocked) {
            if (isBlocked && progress.movesLeft > 0) {
                this.log(`${this.currentPlayer.name} est bloqué par un obstacle : fin du tour.`);
            }
            this.endTurn();
            return;
        }

        this._state = next;
        this.notify();
    }

    // Passe la main à l'adversaire. Si celui-ci est emmuré dès le début
    // de son tour, il passe aussi (sauf si les deux joueurs sont bloqués).
    private endTurn(skippedTurns = 0): void {
        if (this._state.phase !== GAME_PHASES.MOVING) {
            return;
        }

        this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length;

        const next = this.createMovingState({ movesLeft: MAX_MOVE, lockedDirection: null });
        this._state = next;
        this.announceCurrentTurn();

        if (next.reachableCells.length === 0 && skippedTurns < this._players.length - 1) {
            this.log(`${this.currentPlayer.name} ne peut pas bouger et passe son tour.`);
            this.endTurn(skippedTurns + 1);
            return;
        }

        this.notify();
    }

    private createMovingState(progress: TurnProgress): MovingState {
        return {
            phase: GAME_PHASES.MOVING,
            movesLeft: progress.movesLeft,
            lockedDirection: progress.lockedDirection,
            reachableCells: this.computeReachableCells(progress)
        };
    }

    // Une destination par case atteignable dans chaque direction : jusqu'à `movesLeft` cases,
    // en s'arrêtant avant un obstacle / un joueur / le bord de la carte.
    // Si le joueur a déjà avancé ce tour, seule la direction choisie reste possible.
    private computeReachableCells({ movesLeft, lockedDirection }: TurnProgress): ReachableEntry[] {
        const player = this.currentPlayer;
        const entries: ReachableEntry[] = [];

        for (const name of DIRECTION_NAMES) {
            if (lockedDirection !== null && lockedDirection !== name) {
                continue;
            }

            const { dx, dy } = DIRECTIONS[name];
            const path: Cell[] = [];

            for (let step = 1; step <= movesLeft; step++) {
                const cell = this._map.getCell(player.x + dx * step, player.y + dy * step);

                if (!this.canMoveTo(cell)) {
                    break;
                }

                path.push(cell);
                entries.push({ cell, path: [...path] });
            }
        }

        return entries;
    }

    // ==================================================================
    // Phase de combat (COMBAT)
    // ==================================================================

    private startCombat(): void {
        this._state = { phase: GAME_PHASES.COMBAT };
        this._players.forEach(player => {
            player.posture = POSTURES.OFFENSIVE;
        });

        this.log(`${this._players[0].name} et ${this._players[1].name} sont adjacents : le combat s'engage !`);
        this.notify();
    }

    attack(): void {
        if (this._state.phase !== GAME_PHASES.COMBAT) {
            return;
        }

        const attacker = this.currentPlayer;
        const defender = this.opponent;
        const damage = this.computeDamage(attacker, defender);

        defender.takeDamage(damage);
        this.log(`${attacker.name} attaque ${defender.name} avec ${attacker.weapon.name} : ${damage} dégâts.`);

        if (!defender.isAlive) {
            this.endGame(attacker);
            return;
        }

        this.nextCombatTurn();
    }

    togglePosture(): void {
        if (this._state.phase !== GAME_PHASES.COMBAT) {
            return;
        }

        const player = this.currentPlayer;
        player.togglePosture();

        this.log(`${player.name} adopte la posture ${POSTURE_LABELS[player.posture].toLowerCase()}.`);
        this.nextCombatTurn();
    }

    // Posture défensive : le défenseur encaisse moins de dégâts.
    private computeDamage(attacker: Player, defender: Player): number {
        const weaponDamage = attacker.weapon.damage;

        return defender.posture === POSTURES.DEFENSIVE
            ? Math.floor(weaponDamage * DEFENSE_DAMAGE_MULTIPLIER)
            : weaponDamage;
    }

    private nextCombatTurn(): void {
        this._currentPlayerIndex = (this._currentPlayerIndex + 1) % this._players.length;
        this.announceCurrentTurn();
        this.notify();
    }

    // ==================================================================
    // Fin de partie (OVER)
    // ==================================================================

    private endGame(winner: Player): void {
        this._state = { phase: GAME_PHASES.OVER, winner };

        this.log(`${winner.name} remporte la partie !`);
        this.notify();
        this.emit("gameOver", winner);
    }

    // ----- Émission d'événements -----

    private announceCurrentTurn(): void {
        this.log(`Au tour de ${this.currentPlayer.name}.`);
    }

    private log(message: string): void {
        this.emit("log", message);
    }

    private notify(): void {
        this.emit("changed", undefined);
    }
}

// Ce que la vue a le droit de lire : aucune méthode qui modifie la partie.
export type GameReadModel = Pick<GameModel, "map" | "players" | "state" | "currentPlayer" | "canEndTurn">;
