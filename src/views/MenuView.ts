import type { Player } from "../models/Player";
import { requireElement } from "./dom";

// Une liste déroulante + l'aperçu du personnage choisi.
export class PlayerSelectorView {
    private readonly _select: HTMLSelectElement;
    private readonly _preview: HTMLImageElement;

    constructor(selectId: string, previewId: string) {
        this._select = requireElement(selectId, HTMLSelectElement);
        this._preview = requireElement(previewId, HTMLImageElement);
    }

    get value(): string {
        return this._select.value;
    }

    populate(players: readonly Player[]): void {
        this._select.replaceChildren(
            ...players.map(player => {
                const option = document.createElement("option");
                option.value = player.file;
                option.textContent = player.name;
                return option;
            })
        );
    }

    showPreview(player: Player | undefined): void {
        if (!player) {
            this._preview.removeAttribute("src");
            this._preview.removeAttribute("alt");
            return;
        }

        this._preview.src = player.path;
        this._preview.alt = player.name;
    }

    onChange(handler: (value: string) => void): void {
        this._select.addEventListener("change", () => handler(this._select.value));
    }
}

export class MenuView {
    readonly player1 = new PlayerSelectorView("player1", "player1-preview");
    readonly player2 = new PlayerSelectorView("player2", "player2-preview");
    private readonly _startButton = requireElement("start-button", HTMLButtonElement);

    onStart(handler: () => void): void {
        this._startButton.addEventListener("click", handler);
    }

    showError(message: string): void {
        alert(message);
    }

    navigateTo(url: string): void {
        window.location.href = url;
    }
}
