import { Cell, type CellContent } from "./Cell";
import { MAX_GENERATION_ATTEMPTS } from "./config/constants";
import { WEAPON_TYPES } from "./config/Weapons";
import type { Player } from "./Player";
import { PlayerManager } from "./PlayerManager";
import type { Weapon } from "./Weapon";

export class GameMap {
    private readonly _columns: number;
    private readonly _rows: number;
    private readonly _obstacleRate: number;
    private readonly _numberWeapons: number;
    private readonly _grid: Cell[] = [];
    private _weapons: Weapon[] = []; // armes posées au sol
    private readonly _players: Player[] = []; // dans l'ordre de placement (joueur 1 d'abord)

    constructor(columns: number, rows: number, obstacleRate: number, numberWeapons: number) {
        this._columns = columns;
        this._rows = rows;
        this._obstacleRate = obstacleRate;
        this._numberWeapons = numberWeapons;

        this.createGrid();
        this.placeWeapons();
        this.placePlayers();
    }

    get columns(): number {
        return this._columns;
    }

    get rows(): number {
        return this._rows;
    }

    get obstacleRate(): number {
        return this._obstacleRate;
    }

    get numberWeapons(): number {
        return this._numberWeapons;
    }

    get grid(): Cell[] {
        return this._grid;
    }

    get weapons(): Weapon[] {
        return this._weapons;
    }

    get players(): Player[] {
        return this._players;
    }

    // ----- Création -----

    private generateCellContent(): CellContent {
        return Math.random() < this.obstacleRate ? Cell.OBSTACLE : Cell.EMPTY;
    }

    private createGrid(): void {
        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                this.grid.push(new Cell(x, y, this.generateCellContent()));
            }
        }
    }

    // ----- Accès aux cases -----

    isInsideMap(x: number, y: number): boolean {
        return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
    }

    getCell(x: number, y: number): Cell | null {
        return this.isInsideMap(x, y) ? this.grid[x * this.rows + y] : null;
    }

    // Toujours une case valide : les coordonnées tirées sont dans la carte.
    getRandomCell(): Cell {
        const x = Math.floor(Math.random() * this.columns);
        const y = Math.floor(Math.random() * this.rows);

        return this.grid[x * this.rows + y];
    }

    // ----- Armes et joueurs posés sur la grille -----

    getWeaponAt(x: number, y: number): Weapon | null {
        return this.weapons.find(weapon => weapon.x === x && weapon.y === y) ?? null;
    }

    getPlayerAt(x: number, y: number): Player | null {
        return this.players.find(player => player.x === x && player.y === y) ?? null;
    }

    // Pose une arme au sol (placement initial ou arme déposée par un joueur).
    addWeapon(weapon: Weapon, x: number, y: number): void {
        weapon.position = { x, y };
        this.weapons.push(weapon);
    }

    // Retire une arme du sol (ramassée par un joueur).
    removeWeapon(weapon: Weapon): void {
        this._weapons = this.weapons.filter(item => item !== weapon);
        weapon.position = { x: null, y: null };
    }

    // Case vide, sans arme ni joueur.
    isCellFree(cell: Cell): boolean {
        return cell.isEmpty
            && !this.getWeaponAt(cell.x, cell.y)
            && !this.getPlayerAt(cell.x, cell.y);
    }

    // ----- Placement -----

    private placeWeapons(): void {
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

    private placePlayers(): void {
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
    private findPlayerStartingCell(): Cell | null {
        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            const cell = this.getRandomCell();

            if (this.isCellFree(cell) && !this.isAdjacentToPlayer(cell)) {
                return cell;
            }
        }

        return null;
    }

    private isAdjacentToPlayer(cell: Cell): boolean {
        return this.players.some(player =>
            Math.abs(player.x - cell.x) + Math.abs(player.y - cell.y) <= 1
        );
    }

    // ----- Rendu -----

    renderCell(cell: Cell): HTMLDivElement {
        const element = document.createElement("div");
        element.classList.add("map__cell");
        element.dataset.x = String(cell.x);
        element.dataset.y = String(cell.y);
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

    render(container: HTMLElement): void {
        container.innerHTML = "";

        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${this.columns}, minmax(0, 1fr))`;
        container.style.gridTemplateRows = `repeat(${this.rows}, minmax(0, 1fr))`;

        this.grid.forEach(cell => container.appendChild(this.renderCell(cell)));
    }
}
