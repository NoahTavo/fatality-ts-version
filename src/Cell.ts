// Une cellule est soit vide, soit un obstacle.
// Les joueurs et les armes qui se trouvent dessus sont gérés par GameMap.
class Cell {
    static EMPTY = "empty";
    static OBSTACLE = "obstacle";

    constructor(x, y, content = Cell.EMPTY) {
        this._x = x;
        this._y = y;
        this._content = content;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get content() {
        return this._content;
    }

    get isObstacle() {
        return this._content === Cell.OBSTACLE;
    }

    get isEmpty() {
        return this._content === Cell.EMPTY;
    }
}