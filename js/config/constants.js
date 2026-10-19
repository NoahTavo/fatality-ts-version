// ----- Carte -----
const GRID_COLUMNS = 10;
const GRID_ROWS = 10;
const OBSTACLE_RATE = 0.15;          // 15 % de cases inaccessibles
const MAX_WEAPONS = 4;               // nombre maximum d'armes posées sur la carte
const MAX_GENERATION_ATTEMPTS = 100; // sécurité si les joueurs sont emmurés

// ----- Joueurs -----
const PLAYER_MAX_HP = 100;
const MAX_MOVE = 3;                    // cases par tour
const DEFAULT_WEAPON_DAMAGE = 10;      // arme de départ (poings)
const DEFENSE_DAMAGE_MULTIPLIER = 0.5; // posture défensive : -50 % de dégâts

const POSTURES = {
    OFFENSIVE: "offensive",
    DEFENSIVE: "defensive"
};

const POSTURE_LABELS = {
    [POSTURES.OFFENSIVE]: "Offensive",
    [POSTURES.DEFENSIVE]: "Défensive"
};

// ----- États de la partie -----
const GAME_STATES = {
    MOVING: "moving",   // phase de déplacement
    COMBAT: "combat",   // les deux joueurs sont adjacents
    OVER: "over"        // un joueur est tombé à 0 PV
};

// ----- Directions (flèches du clavier) -----
const DIRECTIONS = {
    up:    { dx: -1, dy: 0 },
    down:  { dx: 1,  dy: 0 },
    left:  { dx: 0,  dy: -1 },
    right: { dx: 0,  dy: 1 }
};
// ----- Sélection des personnages (localStorage) -----
const PLAYER1_STORAGE_KEY = "Dynedoc_player1";
const PLAYER2_STORAGE_KEY = "Dynedoc_player2";

// ----- Personnages disponibles (images dans assets/characters/) -----
const PLAYER_FILES = [
    "Jules.png",
    "Noah.png",
    "Wissem.png",
    "Charlie.png",
    "Hamza.png",
    "Faical.png",
    "Abdel.png",
    "Samuel.png"
];
