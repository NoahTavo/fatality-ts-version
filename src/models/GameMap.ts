import { MAX_GENERATION_ATTEMPTS } from "../config/constants";
import { Cell, type CellContent } from "./Cell";
import type { Player } from "./Player";
import type { Weapon } from "./Weapon";

export interface MapConfig {
    readonly columns: number;
    readonly rows: number;
    readonly obstacleRate: number;
    readonly maxWeapons: number;
}

// Modèle de la carte : grille, armes au sol, joueurs posés.
// Plus de DOM ni de localStorage : les joueurs et les armes sont fournis de l'extérieur.
export class GameMap {
    private readonly _config: MapConfig;
    private readonly _grid: readonly Cell[];
    private _weapons: Weapon[] = [];                // armes posées au sol
    private readonly _players: Player[] = [];       // dans l'ordre de placement (joueur 1 d'abord)

    constructor(config: MapConfig, players: readonly Player[], weaponTemplates: readonly Weapon[]) {
        this._config = config;
        this._grid = this.createGrid();
        this.placeWeapons(weaponTemplates.slice(0, config.maxWeapons));
        this.placePlayers(players);
    }

    get columns(): number {
        return this._config.columns;
    }

    get rows(): number {
        return this._config.rows;
    }

    get grid(): readonly Cell[] {
        return this._grid;
    }

    get weapons(): readonly Weapon[] {
        return this._weapons;
    }

    get players(): readonly Player[] {
        return this._players;
    }

    // ----- Création -----

    private generateCellContent(): CellContent {
        return Math.random() < this._config.obstacleRate ? Cell.OBSTACLE : Cell.EMPTY;
    }

    private createGrid(): Cell[] {
        const grid: Cell[] = [];

        for (let x = 0; x < this.columns; x++) {
            for (let y = 0; y < this.rows; y++) {
                grid.push(new Cell(x, y, this.generateCellContent()));
            }
        }

        return grid;
    }

    // ----- Accès aux cases -----

    isInsideMap(x: number, y: number): boolean {
        return x >= 0 && x < this.columns && y >= 0 && y < this.rows;
    }

    getCell(x: number, y: number): Cell | null {
        return this.isInsideMap(x, y) ? this._grid[x * this.rows + y] : null;
    }

    // Toujours une case valide : les coordonnées tirées sont dans la carte.
    private getRandomCell(): Cell {
        const x = Math.floor(Math.random() * this.columns);
        const y = Math.floor(Math.random() * this.rows);

        return this._grid[x * this.rows + y];
    }

    // Tire des cases au hasard jusqu'à en trouver une qui convient (nombre d'essais borné).
    private findCell(predicate: (cell: Cell) => boolean): Cell | null {
        for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            const cell = this.getRandomCell();

            if (predicate(cell)) {
                return cell;
            }
        }

        return null;
    }

    // ----- Armes et joueurs posés sur la grille -----

    getWeaponAt(x: number, y: number): Weapon | null {
        return this._weapons.find(weapon => weapon.position?.x === x && weapon.position?.y === y) ?? null;
    }

    getPlayerAt(x: number, y: number): Player | null {
        return this._players.find(player => player.x === x && player.y === y) ?? null;
    }

    // Pose une arme au sol (placement initial ou arme déposée par un joueur).
    addWeapon(weapon: Weapon, x: number, y: number): void {
        weapon.position = { x, y };
        this._weapons.push(weapon);
    }

    // Retire une arme du sol (ramassée par un joueur).
    removeWeapon(weapon: Weapon): void {
        this._weapons = this._weapons.filter(item => item !== weapon);
        weapon.position = null;
    }

    // Case vide, sans arme ni joueur.
    isCellFree(cell: Cell): boolean {
        return cell.isEmpty
            && !this.getWeaponAt(cell.x, cell.y)
            && !this.getPlayerAt(cell.x, cell.y);
    }

    // ----- Placement -----

    private placeWeapons(templates: readonly Weapon[]): void {
        templates.forEach(template => {
            const cell = this.findCell(candidate => this.isCellFree(candidate));

            if (cell) {
                this.addWeapon(template.clone(), cell.x, cell.y);
            }
        });
    }

    // Case libre, jamais adjacente à un joueur déjà placé.
    private placePlayers(players: readonly Player[]): void {
        players.forEach(player => {
            const cell = this.findCell(candidate =>
                this.isCellFree(candidate) && !this.isAdjacentToPlayer(candidate)
            );

            if (!cell) {
                return;
            }

            player.position = { x: cell.x, y: cell.y };
            this._players.push(player);
        });
    }

    private isAdjacentToPlayer(cell: Cell): boolean {
        return this._players.some(player =>
            Math.abs(player.x - cell.x) + Math.abs(player.y - cell.y) <= 1
        );
    }
}
