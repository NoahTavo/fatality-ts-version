export type CellContent = "empty" | "obstacle";

// Une cellule est soit vide, soit un obstacle.
// Les joueurs et les armes qui se trouvent dessus sont gérés par GameMap.
export class Cell {
    static readonly EMPTY: CellContent = "empty";
    static readonly OBSTACLE: CellContent = "obstacle";

    private readonly _x: number;
    private readonly _y: number;
    private readonly _content: CellContent;

    constructor(x: number, y: number, content: CellContent = Cell.EMPTY) {
        this._x = x;
        this._y = y;
        this._content = content;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get content(): CellContent {
        return this._content;
    }

    get isObstacle(): boolean {
        return this._content === Cell.OBSTACLE;
    }

    get isEmpty(): boolean {
        return this._content === Cell.EMPTY;
    }
}