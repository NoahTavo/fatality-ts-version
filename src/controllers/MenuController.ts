import { isPlayerFile } from "../config/constants";
import type { Player } from "../models/Player";
import type { PlayerRepository } from "../models/PlayerRepository";
import type { MenuView, PlayerSelectorView } from "../views/MenuView";

export class MenuController {
    private readonly _repository: PlayerRepository;
    private readonly _view: MenuView;
    private readonly _players: readonly Player[];

    constructor(repository: PlayerRepository, view: MenuView) {
        this._repository = repository;
        this._view = view;
        this._players = repository.allPlayers;
    }

    init(): void {
        [this._view.player1, this._view.player2].forEach(selector => this.setupSelector(selector));
        this._view.onStart(() => this.startGame());

        console.log("Dynedoc Fatality start.");
        console.log(`${this._players.length} characters available.`);
    }

    private setupSelector(selector: PlayerSelectorView): void {
        selector.populate(this._players);
        this.updatePreview(selector, selector.value);
        selector.onChange(value => this.updatePreview(selector, value));
    }

    private updatePreview(selector: PlayerSelectorView, value: string): void {
        selector.showPreview(this._players.find(player => player.file === value));
    }

    private startGame(): void {
        const first = this._view.player1.value;
        const second = this._view.player2.value;

        if (!isPlayerFile(first) || !isPlayerFile(second)) {
            this._view.showError("Choose a character for each player before starting the game.");
            return;
        }

        this._repository.saveSelection([first, second]);
        this._view.navigateTo("index.html");
    }
}
