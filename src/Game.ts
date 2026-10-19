class Game {
    // Touches du clavier -> nom de direction (voir DIRECTIONS dans config/constants.js)
    static KEY_DIRECTIONS = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
    };

    constructor(map, players) {
        this._map = map;
        this._players = players;
        this._currentPlayerIndex = 0; // le joueur 1 commence toujours
        this._state = GAME_STATES.MOVING;
        this._movesLeft = MAX_MOVE;
        this._lockedDirection = null; // direction choisie pour ce tour (null = pas encore bougé)
        this._reachableCells = [];
        this._winner = null;
    }

    // ==================================================================
    // Getters / setters
    // ==================================================================

    get map() {
        return this._map;
    }

    get players() {
        return this._players;
    }

    get currentPlayerIndex() {
        return this._currentPlayerIndex;
    }

    set currentPlayerIndex(value) {
        this._currentPlayerIndex = value;
    }

    get state() {
        return this._state;
    }

    set state(value) {
        this._state = value;
    }

    get movesLeft() {
        return this._movesLeft;
    }

    set movesLeft(value) {
        this._movesLeft = value;
    }

    get lockedDirection() {
        return this._lockedDirection;
    }

    set lockedDirection(value) {
        this._lockedDirection = value;
    }

    get reachableCells() {
        return this._reachableCells;
    }

    set reachableCells(value) {
        this._reachableCells = value;
    }

    get winner() {
        return this._winner;
    }

    set winner(value) {
        this._winner = value;
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    get opponent() {
        return this.players[(this.currentPlayerIndex + 1) % this.players.length];
    }

    get isMoving() {
        return this.state === GAME_STATES.MOVING;
    }

    get isInCombat() {
        return this.state === GAME_STATES.COMBAT;
    }

    get isOver() {
        return this.state === GAME_STATES.OVER;
    }

    get arePlayersAdjacent() {
        const [first, second] = this.players;

        return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
    }

    switchToNextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    announceCurrentTurn() {
        addLog(`Au tour de ${this.currentPlayer.name}.`);
    }

    // ==================================================================
    // Cycle de vie
    // ==================================================================

    start() {
        addLog(`${this.currentPlayer.name} commence la partie !`);
        this.computeReachableCells();
        renderGame(this);
    }

    // ==================================================================
    // Entrées clavier (appelées depuis main.js)
    // ==================================================================

    handleKey(key) {
        if (this.isOver) {
            return;
        }

        if (this.isInCombat) {
            this.handleCombatKey(key);
            return;
        }

        this.handleMovingKey(key);
    }

    handleCombatKey(key) {
        const lowerKey = key.toLowerCase();

        if (lowerKey === "a") {
            this.attack();
        }

        if (lowerKey === "p") {
            this.togglePosture();
        }
    }

    handleMovingKey(key) {
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
    moveByDirection(directionName) {
        if (!this.isMoving) {
            return;
        }

        const direction = DIRECTIONS[directionName];
        if (!direction) {
            return;
        }

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
    moveToCell(targetCell) {
        if (!this.isMoving) {
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
    
    findReachableEntry(cell) {
        return this.reachableCells.find(entry => entry.cell === cell);
    }

    // Avance case par case ; s'arrête dès que le combat s'engage.
    followPath(path) {
        const player = this.currentPlayer;

        for (const cell of path) {
            this.stepTo(player, cell);

            if (this.arePlayersAdjacent) {
                this.startCombat();
                return;
            }
        }
    }

    rejectMove() {
        addLog("Déplacement impossible : case bloquée ou hors carte.");
        renderGame(this);
    }

    canMoveTo(cell) {
        return Boolean(cell) && !cell.isObstacle && !this.map.getPlayerAt(cell.x, cell.y);
    }

    // Un pas : verrouille la direction du tour, déplace le joueur
    // et consomme un point de déplacement.
    stepTo(player, cell) {
        const dx = cell.x - player.x;
        const dy = cell.y - player.y;

        this.lockedDirection = Object.keys(DIRECTIONS).find(name =>
            DIRECTIONS[name].dx === dx && DIRECTIONS[name].dy === dy
        );

        this.movePlayerTo(player, cell);
        this.movesLeft -= 1;
    }

    movePlayerTo(player, cell) {
        player.position = { x: cell.x, y: cell.y };
        this.pickUpWeapon(player, cell);
    }

    // Ramassage : le joueur échange son arme contre celle au sol,
    // et l'ancienne arme reste sur la case (sauf les poings).
    pickUpWeapon(player, cell) {
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
        }

        if (hasDroppedWeapon) {
            addLog(`${player.name} échange ${dropped.name} contre ${picked.name} (${picked.damage} dégâts).`);
        } else {
            addLog(`${player.name} ramasse ${picked.name} (${picked.damage} dégâts).`);
        }
    }

    // Après un pas au clavier : combat, fin de tour, ou on continue.
    afterMove() {
        if (this.arePlayersAdjacent) {
            this.startCombat();
            return;
        }

        this.continueTurn();
    }

    // Après chaque pas : le tour se termine tout seul s'il ne reste plus
    // de déplacement OU si le joueur est bloqué par un obstacle.
    continueTurn() {
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
    // Le joueur doit avoir avancé d'au moins 1 case avant de passer la main.
get canEndTurn() {
    return this.isMoving && this.movesLeft < MAX_MOVE;
}

endTurnManually() {
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
    endTurn(skippedTurns = 0) {
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
    
    // Une seule destination par direction : la case située à MAX_MOVE cases,
    // ou la dernière case libre avant un obstacle / un joueur / le bord de la carte.
    // Si le joueur a déjà avancé ce tour, seule la direction choisie reste possible.
    computeReachableCells() {
    const player = this.currentPlayer;
    this.reachableCells = [];

    Object.entries(DIRECTIONS).forEach(([name, direction]) => {
        if (this.lockedDirection && this.lockedDirection !== name) {
            return;
        }

        const path = [];

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

    startCombat() {
        this.state = GAME_STATES.COMBAT;
        this.players.forEach(player => {
            player.posture = POSTURES.OFFENSIVE;
        });

        addLog(`${this.players[0].name} et ${this.players[1].name} sont adjacents : le combat s'engage !`);
        renderGame(this);
    }

    attack() {
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
    computeDamage(attacker, defender) {
        const weaponDamage = attacker.weapon.damage;

        if (defender.posture === POSTURES.DEFENSIVE) {
            return Math.floor(weaponDamage * DEFENSE_DAMAGE_MULTIPLIER);
        }

        return weaponDamage;
    }

    togglePosture() {
        if (!this.isInCombat) {
            return;
        }

        const player = this.currentPlayer;
        player.togglePosture();

        addLog(`${player.name} adopte la posture ${POSTURE_LABELS[player.posture].toLowerCase()}.`);
        this.nextCombatTurn();
    }

    nextCombatTurn() {
        this.switchToNextPlayer();
        this.announceCurrentTurn();
        renderGame(this);
    }

    // ==================================================================
    // Fin de partie (OVER)
    // ==================================================================

    gameOver(winner) {
        this.state = GAME_STATES.OVER;
        this.winner = winner;

        addLog(`${winner.name} remporte la partie !`);
        renderGame(this);
        showGameOver(winner);
    }
}