import type { Position } from "./types";

// Modèle pur : plus aucune référence au DOM (l'affichage est géré par MapView).
export class Weapon {
    private readonly _id: string;
    private readonly _name: string;
    private readonly _damage: number;
    private readonly _icon: string;           // chemin vers le SVG de l'arme
    private _position: Position | null;       // null si l'arme est portée par un joueur

    constructor(id: string, name: string, damage: number, icon: string, position: Position | null = null) {
        this._id = id;
        this._name = name;
        this._damage = damage;
        this._icon = icon;
        this._position = position;
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

    get position(): Position | null {
        return this._position;
    }

    set position(value: Position | null) {
        this._position = value;
    }

    // Copie indépendante : chaque arme posée sur la carte a sa propre position.
    clone(): Weapon {
        return new Weapon(this.id, this.name, this.damage, this.icon);
    }
}
