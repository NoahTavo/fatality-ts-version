export interface WeaponPosition {
    x: number | null;
    y: number | null;
}

export class Weapon {
    private readonly _id: string;
    private readonly _name: string;
    private readonly _damage: number;
    private readonly _icon: string; // chemin vers le SVG de l'arme
    private _x: number | null;      // position sur la carte (null si portée par un joueur)
    private _y: number | null;

    constructor(
        id: string,
        name: string,
        damage: number,
        icon: string,
        x: number | null = null,
        y: number | null = null
    ) {
        this._id = id;
        this._name = name;
        this._damage = damage;
        this._icon = icon;
        this._x = x;
        this._y = y;
    }

    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    get damage(): number {
        return this._damage;
    }

    get icon(): string {
        return this._icon;
    }

    get x(): number | null {
        return this._x;
    }

    get y(): number | null {
        return this._y;
    }

    get position(): WeaponPosition {
        return { x: this.x, y: this.y };
    }

    set position({ x, y }: WeaponPosition) {
        this._x = x;
        this._y = y;
    }

    // Copie indépendante : chaque arme posée sur la carte a sa propre position.
    clone(): Weapon {
        return new Weapon(this.id, this.name, this.damage, this.icon);
    }

    // Permet à GameMap de savoir comment afficher une arme posée au sol.
    render(): HTMLImageElement {
        const image = document.createElement("img");
        image.classList.add("map__cell-sprite");
        image.src = this.icon;
        image.alt = this.name;
        return image;
    }
}