import { PLAYER1_STORAGE_KEY, PLAYER2_STORAGE_KEY } from "./config/constants";
import type { Player } from "./Player";
import { PlayerManager } from "./PlayerManager";

// ---------------------------------------------------------------------------
// Menu : sélection des personnages (fatality.html)
// ---------------------------------------------------------------------------
class PlayerSelector {
    private readonly _select: HTMLSelectElement | null;
    private readonly _preview: HTMLImageElement | null;
    private readonly _players: Player[];

    constructor(selectId: string, previewId: string, players: Player[]) {
        this._select = document.getElementById(selectId) as HTMLSelectElement | null;
        this._preview = document.getElementById(previewId) as HTMLImageElement | null;
        this._players = players;
        this.initialize();
    }

    get select(): HTMLSelectElement | null {
        return this._select;
    }

    get preview(): HTMLImageElement | null {
        return this._preview;
    }

    get players(): Player[] {
        return this._players;
    }

    private initialize(): void {
        if (!this.select || !this.preview) {
            return;
        }

        this.populateSelect(this.select);
        this.listenToSelectionChange(this.select, this.preview);
    }

    private populateSelect(select: HTMLSelectElement): void {
        select.replaceChildren();

        this.players.forEach(player => {
            const option = document.createElement("option");
            option.value = player.file;
            option.textContent = player.name;
            select.appendChild(option);
        });
    }

    // Met à jour l'aperçu à chaque changement de personnage dans la liste.
    private listenToSelectionChange(select: HTMLSelectElement, preview: HTMLImageElement): void {
        select.addEventListener("change", () => this.updatePreview(select, preview));
    }

    private updatePreview(select: HTMLSelectElement, preview: HTMLImageElement): void {
        const player = this.players.find(item => item.file === select.value);

        if (!player) {
            preview.removeAttribute("src");
            preview.removeAttribute("alt");
            return;
        }

        preview.src = player.path;
        preview.alt = player.name;
    }
}

class FatalityMenu {
    private readonly _playerManager = new PlayerManager();

    constructor() {
        this.createSelectors();
    }

    get playerManager(): PlayerManager {
        return this._playerManager;
    }

    private createSelectors(): void {
        const { players } = this.playerManager;

        new PlayerSelector("player1", "player1-preview", players);
        new PlayerSelector("player2", "player2-preview", players);
    }

    start(): void {
        console.log("Dynedoc Fatality start.");
        console.log(`${this.playerManager.players.length} characters available.`);
    }
}

const startGame = (): void => {
    const select1 = document.getElementById("player1") as HTMLSelectElement | null;
    const select2 = document.getElementById("player2") as HTMLSelectElement | null;

    if (!select1 || !select2) {
        console.error("Character selectors not found.");
        return;
    }

    if (!select1.value || !select2.value) {
        alert("Choose a character for each player before starting the game.");
        return;
    }

    localStorage.setItem(PLAYER1_STORAGE_KEY, select1.value);
    localStorage.setItem(PLAYER2_STORAGE_KEY, select2.value);

    window.location.href = "index.html";
};

document.addEventListener("DOMContentLoaded", () => {
    new FatalityMenu().start();
    document.getElementById("start-button")?.addEventListener("click", startGame);
});
