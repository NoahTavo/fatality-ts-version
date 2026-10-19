class Player {
    constructor(file, x = null, y = null) {
        this._file = file;
        this._name = file.replace(/\.png$/i, "");
        this._path = `assets/characters/${file}`;
        this._x = x;
        this._y = y;
        this._hp = PLAYER_MAX_HP;
        this._weapon = DEFAULT_WEAPON; // Poings, avant tout ramassage
        this._posture = POSTURES.OFFENSIVE;
    }

    get file() {
        return this._file;
    }

    get name() {
        return this._name;
    }

    get path() {
        return this._path;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get position() {
        return { x: this.x, y: this.y };
    }

    set position({ x, y }) {
        this._x = x;
        this._y = y;
    }

    get hp() {
        return this._hp;
    }

    // Les PV restent toujours entre 0 et PLAYER_MAX_HP.
    set hp(value) {
        this._hp = Math.max(0, Math.min(PLAYER_MAX_HP, value));
    }

    get isAlive() {
        return this.hp > 0;
    }

    get weapon() {
        return this._weapon;
    }

    set weapon(value) {
        this._weapon = value;
    }

    get posture() {
        return this._posture;
    }

    set posture(value) {
        this._posture = value;
    }

    takeDamage(damage) {
        this.hp -= damage;
    }

    // Posture défensive : -50 % de dégâts subis au prochain tour.
    togglePosture() {
        this.posture = this.posture === POSTURES.OFFENSIVE
            ? POSTURES.DEFENSIVE
            : POSTURES.OFFENSIVE;
    }
}

// ---------------------------------------------------------------------------
// Menu : sélection des personnages (fatality.html)
// ---------------------------------------------------------------------------
class PlayerSelector {
    constructor(selectId, previewId, players) {
        this._select = document.getElementById(selectId);
        this._preview = document.getElementById(previewId);
        this._players = players;
        this.initialize();
    }

    get select() {
        return this._select;
    }

    get preview() {
        return this._preview;
    }

    get players() {
        return this._players;
    }

    initialize() {
        // Absent sur les pages sans sélecteur de personnage (index.html).
        if (!this.select || !this.preview) {
            return;
        }

        this.populateSelect();
        this.listenToSelectionChange();
    }

    populateSelect() {
        this.select.replaceChildren();

        this.players.forEach(player => {
            const option = document.createElement("option");
            option.value = player.file;
            option.textContent = player.name;
            this.select.appendChild(option);
        });
    }

    // Met à jour l'aperçu à chaque changement de personnage dans la liste.
    listenToSelectionChange() {
        this.select.addEventListener("change", () => this.updatePreview());
    }

    updatePreview() {
        const player = this.players.find(item => item.file === this.select.value);

        if (!player) {
            this.preview.removeAttribute("src");
            this.preview.removeAttribute("alt");
            return;
        }

        this.preview.src = player.path;
        this.preview.alt = player.name;
    }
}

class PlayerManager {
    constructor() {
        this._players = PLAYER_FILES.map(file => new Player(file));
    }

    get players() {
        return this._players;
    }

    findPlayer(file) {
        return this.players.find(player => player.file === file);
    }

    // Joueurs choisis dans le menu (joueur 1 puis joueur 2).
    // Nouvelle instance à chaque fois : les deux joueurs peuvent avoir le même personnage.
    get selectedPlayers() {
        return [PLAYER1_STORAGE_KEY, PLAYER2_STORAGE_KEY]
            .map(key => localStorage.getItem(key))
            .filter(file => this.findPlayer(file))
            .map(file => new Player(file));
    }
}

class FatalityMenu {
    constructor() {
        this._playerManager = new PlayerManager();
        this.createSelectors();
    }

    get playerManager() {
        return this._playerManager;
    }

    createSelectors() {
        const { players } = this.playerManager;

        new PlayerSelector("player1", "player1-preview", players);
        new PlayerSelector("player2", "player2-preview", players);
    }

    start() {
        console.log("Dynedoc Fatality start.");
        console.log(`${this.playerManager.players.length} characters available.`);
    }
}

const displayPlayerNames = () => {
    const manager = new PlayerManager();
    const cards = [
        { key: PLAYER1_STORAGE_KEY, selector: ".player-card--p1 .player-card__name" },
        { key: PLAYER2_STORAGE_KEY, selector: ".player-card--p2 .player-card__name" }
    ];

    cards.forEach(({ key, selector }) => {
        const nameElement = document.querySelector(selector);
        const player = manager.findPlayer(localStorage.getItem(key));

        if (nameElement && player) {
            nameElement.textContent = player.name;
        }
    });
};

const startGame = () => {
    const select1 = document.getElementById("player1");
    const select2 = document.getElementById("player2");

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
    displayPlayerNames();
});
