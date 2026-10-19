class GameMap {
    constructor(columns, rows, obstacleRate, numberWeapons) {
        this._columns = columns;
        this._rows = rows;
        this._obstacleRate = obstacleRate;
        this._numberWeapons = numberWeapons;
        this._grid = [];
        this._weapons = []; // armes posées au sol
        this._players = []; // dans l'ordre de placement (joueur 1 d'abord)

        this.createGrid();
        this.placeWeapons();
        this.placePlayers();
    }

    get columns() {
        return this._columns;
    }

    get rows() {
        return this._rows;
    }

    get obstacleRate() {
        return this._obstacleRate;
    }

    get numberWeapons() {
        return this._numberWeapons;
    }

    get grid() {
        return this._grid;
    }

    get weapons() {
        return this._weapons;
    }

    get players() {
        return this._players;
    }

    // ----- Création -----

    generateCellContent() {
        return Math.random() < this.obstacleRate ? Cell.OBSTACLE : Cell.EMPTY;
    }

    createGrid() {
        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                this.grid.push(new Cell(x, y, this.generateCellContent()));
            }
        }
    }

    // ----- Accès aux cases -----

    isInsideMap(x, y) {
        return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
    }

    getCell(x, y) {
        return this.isInsideMap(x, y) ? this.grid[x * this.rows + y] : null;
    }

    getRandomCell() {
        const x = Math.floor(Math.random() * this.columns);
        const y = Math.floor(Math.random() * this.rows);

        return this.getCell(x, y);
    }

    // ----- Armes et joueurs posés sur la grille -----

    getWeaponAt(x, y) {
        return this.weapons.find(weapon => weapon.x === x && weapon.y === y) || null;
    }

    getPlayerAt(x, y) {
        return this.players.find(player => player.x === x && player.y === y) || null;
    }

    // Pose une arme au sol (placement initial ou arme déposée par un joueur).
    addWeapon(weapon, x, y) {
        weapon.position = { x, y };
        this.weapons.push(weapon);
    }

    // Retire une arme du sol (ramassée par un joueur).
    removeWeapon(weapon) {
        this._weapons = this.weapons.filter(item => item !== weapon);
        weapon.position = { x: null, y: null };
    }

    // Case vide, sans arme ni joueur.
    isCellFree(cell) {
        return cell.isEmpty
            && !this.getWeaponAt(cell.x, cell.y)
            && !this.getPlayerAt(cell.x, cell.y);
    }

    // ----- Placement -----

    placeWeapons() {
        WEAPON_TYPES.forEach(weaponType => {
            let isSearchingCell = true;

            while (isSearchingCell) {
                const cell = this.getRandomCell();

                if (this.isCellFree(cell)) {
                    this.addWeapon(weaponType.clone(), cell.x, cell.y);
                    isSearchingCell = false;
                }
            }
        });
    }

    placePlayers() {
        new PlayerManager().selectedPlayers.forEach(player => {
            const cell = this.findPlayerStartingCell();

            if (!cell) {
                return;
            }

            player.position = { x: cell.x, y: cell.y };
            this.players.push(player);
        });
    }

    // Case libre, jamais adjacente à un joueur déjà placé.
    findPlayerStartingCell() {
        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            const cell = this.getRandomCell();

            if (this.isCellFree(cell) && !this.isAdjacentToPlayer(cell)) {
                return cell;
            }
        }

        return null;
    }

    isAdjacentToPlayer(cell) {
        return this.players.some(player =>
            Math.abs(player.x - cell.x) + Math.abs(player.y - cell.y) <= 1
        );
    }

    // ----- Rendu -----

    renderCell(cell) {
        const element = document.createElement("div");
        element.classList.add("map__cell");
        element.dataset.x = cell.x;
        element.dataset.y = cell.y;
        element.dataset.testid = `map-cell-${cell.x}-${cell.y}`;

        if (cell.isObstacle) {
            element.classList.add("map__cell--obstacle");
        }

        const player = this.getPlayerAt(cell.x, cell.y);
        const weapon = this.getWeaponAt(cell.x, cell.y);

        // Le joueur est affiché par-dessus une éventuelle arme au sol.
        if (player) {
            element.classList.add("map__cell--personnage");

            const image = document.createElement("img");
            image.classList.add("map__cell-sprite");
            image.src = player.path;
            image.alt = player.name;
            element.appendChild(image);
        } else if (weapon) {
            element.classList.add("map__cell--arme");
            element.appendChild(weapon.render());
        }

        return element;
    }

    render(container) {
        container.innerHTML = "";

        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${this.columns}, minmax(0, 1fr))`;
        container.style.gridTemplateRows = `repeat(${this.rows}, minmax(0, 1fr))`;

        this.grid.forEach(cell => container.appendChild(this.renderCell(cell)));
    }
}

// La création de la carte est déclenchée par main.js, le rendu par renderGame (ui/render.js).