import {
    DEFENSE_DAMAGE_MULTIPLIER,
    DIRECTIONS,
    DIRECTION_NAMES,
    GAME_STATES,
    MAX_MOVE,
    POSTURES,
    POSTURE_LABELS,
    type DirectionName,
    type GameState
} from "./config/constants";
import { DEFAULT_WEAPON } from "./config/Weapons";
import type { Cell } from "./Cell";
import type { GameMap } from "./GameMap";
import type { Player } from "./Player";
import { addLog, renderGame, showGameOver } from "./ui/render";

// Une case atteignable ce tour, avec le chemin complet pour y arriver.
export interface ReachableEntry {
    cell: Cell;
    path: Cell[];
}

export class Game {
    // Touches du clavier -> nom de direction (voir DIRECTIONS dans config/constants.ts)
    static readonly KEY_DIRECTIONS: Readonly<Record<string, DirectionName | undefined>> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    private readonly _map: GameMap;
    private readonly _players: Player[];
    private _currentPlayerIndex = 0; // le joueur 1 commence toujours
    private _state: GameState = GAME_STATES.MOVING;
    private _movesLeft: number = MAX_MOVE;
    private _lockedDirection: DirectionName | null = null; // direction choisie pour ce tour (null = pas encore bougé)
    private _reachableCells: ReachableEntry[] = [];
    private _winner: Player | null = null;

    constructor(map: GameMap, players: Player[]) {
        this._map = map;
        this._players = players;
    }

    // ==================================================================
    // Getters / setters
    // ==================================================================

    get map(): GameMap {
        return this._map;
    }

    get players(): Player[] {
        return this._players;
    }

    get currentPlayerIndex(): number {
        return this._currentPlayerIndex;
    }

    set currentPlayerIndex(value: number) {
        this._currentPlayerIndex = value;
    }

    get state(): GameState {
        return this._state;
    }

    set state(value: GameState) {
        this._state = value;
    }

    get movesLeft(): number {
        return this._movesLeft;
    }

    set movesLeft(value: number) {
        this._movesLeft = value;
    }

    get lockedDirection(): DirectionName | null {
        return this._lockedDirection;
    }

    set lockedDirection(value: DirectionName | null) {
        this._lockedDirection = value;
    }

    get reachableCells(): ReachableEntry[] {
        return this._reachableCells;
    }

    set reachableCells(value: ReachableEntry[]) {
        this._reachableCells = value;
    }

    get winner(): Player | null {
        return this._winner;
    }

    set winner(value: Player | null) {
        this._winner = value;
    }

    get currentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    get opponent(): Player {
        return this.players[(this.currentPlayerIndex + 1) % this.players.length];
    }

    get isMoving(): boolean {
        return this.state === GAME_STATES.MOVING;
    }

    get isInCombat(): boolean {
        return this.state === GAME_STATES.COMBAT;
    }

    get isOver(): boolean {
        return this.state === GAME_STATES.OVER;
    }

    get arePlayersAdjacent(): boolean {
        const [first, second] = this.players;

        return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
    }

    // Le joueur doit avoir avancé d'au moins 1 case avant de passer la main.
    get canEndTurn(): boolean {
        return this.isMoving && this.movesLeft < MAX_MOVE;
    }

    switchToNextPlayer(): void {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    announceCurrentTurn(): void {
        addLog(`Au tour de ${this.currentPlayer.name}.`);
    }

    // ==================================================================
    // Cycle de vie
    // ==================================================================

    start(): void {
        addLog(`${this.currentPlayer.name} commence la partie !`);
        this.computeReachableCells();
        renderGame(this);
    }

    // ==================================================================
    // Entrées clavier (appelées depuis main.ts)
    // ==================================================================

    handleKey(key: string): void {
        if (this.isOver) {
            return;
        }

        if (this.isInCombat) {
            this.handleCombatKey(key);
            return;
        }

        this.handleMovingKey(key);
    }

    private handleCombatKey(key: string): void {
        const lowerKey = key.toLowerCase();

        if (lowerKey === "a") {
            this.attack();
        }

        if (lowerKey === "p") {
            this.togglePosture();
        }
    }

    private handleMovingKey(key: string): void {
        if (key === "Enter") {
            this.endTurnManually();
            return;
        }

        const directionName = Game.KEY_DIRECTIONS[key];

        if (directionName) {
            this.moveByDirection(directionName);
        }
    }

    // ==================================================================
    // Phase de déplacement (MOVING)
    // ==================================================================

    // Déplacement d'une case au clavier.
    // Un changement de direction pendant un déplacement est interdit.
    moveByDirection(directionName: DirectionName): void {
        if (!this.isMoving) {
            return;
        }

        const direction = DIRECTIONS[directionName];

        if (this.lockedDirection && this.lockedDirection !== directionName) {
            addLog("Changement de direction interdit pendant un déplacement.");
            renderGame(this);
            return;
        }

        const player = this.currentPlayer;
        const cell = this.map.getCell(player.x + direction.dx, player.y + direction.dy);

        if (!this.canMoveTo(cell)) {
            this.rejectMove();
            return;
        }

        this.stepTo(player, cell);
        this.afterMove();
    }

    // Déplacement au clic : le joueur suit le chemin complet jusqu'à la case ciblée,
    // puis le tour passe directement à l'adversaire (même s'il lui restait des déplacements).
    moveToCell(targetCell: Cell | null): void {
        if (!this.isMoving || !targetCell) {
            return;
        }

        const target = this.findReachableEntry(targetCell);
        if (!target) {
            return;
        }

        this.followPath(target.path);

        // Si le combat s'est engagé en chemin, startCombat() gère déjà l'affichage.
        // Sinon, on termine le tour immédiatement.
        if (this.isMoving) {
            this.endTurn();
        }
    }

    private findReachableEntry(cell: Cell): ReachableEntry | undefined {
        return this.reachableCells.find(entry => entry.cell === cell);
    }

    // Avance case par case ; s'arrête dès que le combat s'engage.
    private followPath(path: Cell[]): void {
        const player = this.currentPlayer;

        for (const cell of path) {
            this.stepTo(player, cell);

            if (this.arePlayersAdjacent) {
                this.startCombat();
                return;
            }
        }
    }

    private rejectMove(): void {
        addLog("Déplacement impossible : case bloquée ou hors carte.");
        renderGame(this);
    }

    private canMoveTo(cell: Cell | null): cell is Cell {
        return cell !== null && !cell.isObstacle && !this.map.getPlayerAt(cell.x, cell.y);
    }

    // Un pas : verrouille la direction du tour, déplace le joueur
    // et consomme un point de déplacement.
    private stepTo(player: Player, cell: Cell): void {
        const dx = cell.x - player.x;
        const dy = cell.y - player.y;

        this.lockedDirection = DIRECTION_NAMES.find(name =>
            DIRECTIONS[name].dx === dx && DIRECTIONS[name].dy === dy
        ) ?? null;

        this.movePlayerTo(player, cell);
        this.movesLeft -= 1;
    }

    private movePlayerTo(player: Player, cell: Cell): void {
        player.position = { x: cell.x, y: cell.y };
        this.pickUpWeapon(player, cell);
    }

    // Ramassage : le joueur échange son arme contre celle au sol,
    // et l'ancienne arme reste sur la case (sauf les poings).
    private pickUpWeapon(player: Player, cell: Cell): void {
        const picked = this.map.getWeaponAt(cell.x, cell.y);

        if (!picked) {
            return;
        }

        const dropped = player.weapon;

        this.map.removeWeapon(picked);
        player.weapon = picked;

        const hasDroppedWeapon = dropped !== DEFAULT_WEAPON;
        if (hasDroppedWeapon) {
            this.map.addWeapon(dropped, cell.x, cell.y);
            addLog(`${player.name} échange ${dropped.name} contre ${picked.name} (${picked.damage} dégâts).`);
        } else {
            addLog(`${player.name} ramasse ${picked.name} (${picked.damage} dégâts).`);
        }
    }

    // Après un pas au clavier : combat, fin de tour, ou on continue.
    private afterMove(): void {
        if (this.arePlayersAdjacent) {
            this.startCombat();
            return;
        }

        this.continueTurn();
    }

    // Après chaque pas : le tour se termine tout seul s'il ne reste plus
    // de déplacement OU si le joueur est bloqué par un obstacle.
    private continueTurn(): void {
        this.computeReachableCells();

        const isBlocked = this.reachableCells.length === 0;

        if (this.movesLeft <= 0 || isBlocked) {
            if (isBlocked && this.movesLeft > 0) {
                addLog(`${this.currentPlayer.name} est bloqué par un obstacle : fin du tour.`);
            }
            this.endTurn();
            return;
        }

        renderGame(this);
    }

    endTurnManually(): void {
        if (!this.isMoving) {
            return;
        }

        if (!this.canEndTurn) {
            addLog(`${this.currentPlayer.name} doit se déplacer d'au moins 1 case.`);
            renderGame(this);
            return;
        }

        this.endTurn();
    }

    // Passe la main à l'adversaire. Si celui-ci est emmuré dès le début
    // de son tour, il passe aussi (sauf si les deux joueurs sont bloqués).
    private endTurn(skippedTurns = 0): void {
        if (!this.isMoving) {
            return;
        }

        this.switchToNextPlayer();
        this.movesLeft = MAX_MOVE;
        this.lockedDirection = null;
        this.computeReachableCells();
        this.announceCurrentTurn();

        if (this.reachableCells.length === 0 && skippedTurns < this.players.length - 1) {
            addLog(`${this.currentPlayer.name} ne peut pas bouger et passe son tour.`);
            this.endTurn(skippedTurns + 1);
            return;
        }

        renderGame(this);
    }

    // Une destination par case atteignable dans chaque direction : jusqu'à MAX_MOVE cases,
    // en s'arrêtant avant un obstacle / un joueur / le bord de la carte.
    // Si le joueur a déjà avancé ce tour, seule la direction choisie reste possible.
    private computeReachableCells(): void {
        const player = this.currentPlayer;
        this.reachableCells = [];

        DIRECTION_NAMES.forEach(name => {
            if (this.lockedDirection && this.lockedDirection !== name) {
                return;
            }

            const direction = DIRECTIONS[name];
            const path: Cell[] = [];

            for (let step = 1; step <= this.movesLeft; step++) {
                const cell = this.map.getCell(
                    player.x + direction.dx * step,
                    player.y + direction.dy * step
                );

                if (!this.canMoveTo(cell)) {
                    break;
                }

                path.push(cell);
                this.reachableCells.push({ cell, path: [...path] });
            }
        });
    }

    // ==================================================================
    // Phase de combat (COMBAT)
    // ==================================================================

    private startCombat(): void {
        this.state = GAME_STATES.COMBAT;
        this.players.forEach(player => {
            player.posture = POSTURES.OFFENSIVE;
        });

        addLog(`${this.players[0].name} et ${this.players[1].name} sont adjacents : le combat s'engage !`);
        renderGame(this);
    }

    attack(): void {
        if (!this.isInCombat) {
            return;
        }

        const attacker = this.currentPlayer;
        const defender = this.opponent;
        const damage = this.computeDamage(attacker, defender);

        defender.takeDamage(damage);
        addLog(`${attacker.name} attaque ${defender.name} avec ${attacker.weapon.name} : ${damage} dégâts.`);

        if (!defender.isAlive) {
            this.gameOver(attacker);
            return;
        }

        this.nextCombatTurn();
    }

    // Posture défensive : le défenseur encaisse moins de dégâts.
    private computeDamage(attacker: Player, defender: Player): number {
        const weaponDamage = attacker.weapon.damage;

        if (defender.posture === POSTURES.DEFENSIVE) {
            return Math.floor(weaponDamage * DEFENSE_DAMAGE_MULTIPLIER);
        }

        return weaponDamage;
    }

    togglePosture(): void {
        if (!this.isInCombat) {
            return;
        }

        const player = this.currentPlayer;
        player.togglePosture();

        addLog(`${player.name} adopte la posture ${POSTURE_LABELS[player.posture].toLowerCase()}.`);
        this.nextCombatTurn();
    }

    private nextCombatTurn(): void {
        this.switchToNextPlayer();
        this.announceCurrentTurn();
        renderGame(this);
    }

    // ==================================================================
    // Fin de partie (OVER)
    // ==================================================================

    private gameOver(winner: Player): void {
        this.state = GAME_STATES.OVER;
        this.winner = winner;

        addLog(`${winner.name} remporte la partie !`);
        renderGame(this);
        showGameOver(winner);
    }
}
