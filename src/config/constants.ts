// ----- Carte -----
export const GRID_COLUMNS = 10;
export const GRID_ROWS = 10;
export const OBSTACLE_RATE = 0.15;          // 15 % de cases inaccessibles
export const MAX_WEAPONS = 4;               // nombre maximum d'armes posées sur la carte
export const MAX_GENERATION_ATTEMPTS = 100; // sécurité si les joueurs sont emmurés

// ----- Joueurs -----
export const PLAYER_MAX_HP = 100;
export const MAX_MOVE = 3;                    // cases par tour
export const DEFAULT_WEAPON_DAMAGE = 10;      // arme de départ (poings)
export const DEFENSE_DAMAGE_MULTIPLIER = 0.5; // posture défensive : -50 % de dégâts

export const POSTURES = {
    OFFENSIVE: "offensive",
    DEFENSIVE: "defensive"
} as const;

export type Posture = (typeof POSTURES)[keyof typeof POSTURES];

export const POSTURE_LABELS: Record<Posture, string> = {
    [POSTURES.OFFENSIVE]: "Offensive",
    [POSTURES.DEFENSIVE]: "Défensive"
};

// ----- États de la partie -----
export const GAME_STATES = {
    MOVING: "moving",   // phase de déplacement
    COMBAT: "combat",   // les deux joueurs sont adjacents
    OVER: "over"        // un joueur est tombé à 0 PV
} as const;

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

// ----- Directions (flèches du clavier) -----
export type DirectionName = "up" | "down" | "left" | "right";

export interface Direction {
    dx: number;
    dy: number;
}

export const DIRECTIONS: Record<DirectionName, Direction> = {
    up:    { dx: -1, dy: 0 },
    down:  { dx: 1,  dy: 0 },
    left:  { dx: 0,  dy: -1 },
    right: { dx: 0,  dy: 1 }
};

export const DIRECTION_NAMES = Object.keys(DIRECTIONS) as DirectionName[];

// ----- Sélection des personnages (localStorage) -----
export const PLAYER1_STORAGE_KEY = "Dynedoc_player1";
export const PLAYER2_STORAGE_KEY = "Dynedoc_player2";

// ----- Personnages disponibles (images dans public/assets/characters/) -----
export const PLAYER_FILES: string[] = [
    "Jules.png",
    "Noah.png",
    "Wissem.png",
    "Charlie.png",
    "Hamza.png",
    "Faical.png",
    "Abdel.png",
    "Samuel.png"
];