import { PLAYER_MAX_HP, POSTURES, type Posture } from "./config/constants";
import { DEFAULT_WEAPON } from "./config/Weapons";
import type { Position } from "./types";
import type { Weapon } from "./Weapon";

// Position d'un joueur qui n'a pas encore été posé sur la carte.
const NOT_PLACED = -1;

export class Player {
    private readonly _file: string;
    private readonly _name: string;
    private readonly _path: string;
    private _x: number;
    private _y: number;
    private _hp: number;
    private _weapon: Weapon;
    private _posture: Posture;

    constructor(file: string, x: number = NOT_PLACED, y: number = NOT_PLACED) {
        this._file = file;
        this._name = file.replace(/\.png$/i, "");
        this._path = `assets/characters/${file}`;
        this._x = x;
        this._y = y;
        this._hp = PLAYER_MAX_HP;
        this._weapon = DEFAULT_WEAPON; // Poings, avant tout ramassage
        this._posture = POSTURES.OFFENSIVE;
    }

    get file(): string {
        return this._file;
    }

    get name(): string {
        return this._name;
    }

    get path(): string {
        return this._path;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get position(): Position {
        return { x: this.x, y: this.y };
    }

    set position({ x, y }: Position) {
        this._x = x;
        this._y = y;
    }

    get hp(): number {
        return this._hp;
    }

    // Les PV restent toujours entre 0 et PLAYER_MAX_HP.
    set hp(value: number) {
        this._hp = Math.max(0, Math.min(PLAYER_MAX_HP, value));
    }

    get isAlive(): boolean {
        return this.hp > 0;
    }

    get weapon(): Weapon {
        return this._weapon;
    }

    set weapon(value: Weapon) {
        this._weapon = value;
    }

    get posture(): Posture {
        return this._posture;
    }

    set posture(value: Posture) {
        this._posture = value;
    }

    takeDamage(damage: number): void {
        this.hp -= damage;
    }

    // Posture défensive : -50 % de dégâts subis au prochain tour.
    togglePosture(): void {
        this.posture = this.posture === POSTURES.OFFENSIVE
            ? POSTURES.DEFENSIVE
            : POSTURES.OFFENSIVE;
    }
}