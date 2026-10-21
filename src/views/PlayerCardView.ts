import { PLAYER_MAX_HP, POSTURE_LABELS } from "../config/constants";
import type { Player } from "../models/Player";
import { queryRequired, requireElement } from "./dom";

// Fiche d'un joueur (nom, PV, arme, posture).
export class PlayerCardView {
    private readonly _root: HTMLElement;
    private readonly _name: HTMLElement;
    private readonly _hpValue: HTMLElement;
    private readonly _hpFill: HTMLElement;
    private readonly _weaponValue: HTMLElement;
    private readonly _postureValue: HTMLElement;

    constructor(cardId: string) {
        this._root = requireElement(cardId, HTMLElement);
        this._name = queryRequired(this._root, ".player-card__name");
        this._hpValue = queryRequired(this._root, ".hp-value");
        this._hpFill = queryRequired(this._root, ".player-card__hp-fill");
        this._weaponValue = queryRequired(this._root, ".weapon-value");
        this._postureValue = queryRequired(this._root, ".posture-value");
    }

    render(player: Player, isActive: boolean): void {
        this._name.textContent = player.name;
        this._hpValue.textContent = String(player.hp);
        this._weaponValue.textContent = player.weapon.name;
        this._postureValue.textContent = POSTURE_LABELS[player.posture];
        this._hpFill.style.width = `${(player.hp / PLAYER_MAX_HP) * 100}%`;
        this._root.classList.toggle("player-card--active", isActive);
    }
}
