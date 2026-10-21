// ----- Carte -----
export const GRID_COLUMNS = 10;
export const GRID_ROWS = 10;
export const OBSTACLE_RATE = 0.15;          // 15 % de cases inaccessibles
export const MAX_WEAPONS = 4;               // nombre maximum d'armes posées sur la carte
export const MAX_GENERATION_ATTEMPTS = 100; // sécurité si les joueurs sont emmurés

// ----- Joueurs -----
export const PLAYERS_COUNT = 2;
export const PLAYER_MAX_HP = 100;
export const MAX_MOVE = 3;                    // cases par tour
export const DEFAULT_WEAPON_DAMAGE = 10;      // arme de départ (poings)
export const DEFENSE_DAMAGE_MULTIPLIER = 0.5; // posture défensive : -50 % de dégâts

export const POSTURES = {
    OFFENSIVE: "offensive",
    DEFENSIVE: "defensive"
} as const;

export type Posture = (typeof POSTURES)[keyof typeof POSTURES];

export const POSTURE_LABELS: Readonly<Record<Posture, string>> = {
    [POSTURES.OFFENSIVE]: "Offensive",
    [POSTURES.DEFENSIVE]: "Défensive"
};

// ----- Phases de la partie (discriminant de l'union GameState) -----
export const GAME_PHASES = {
    MOVING: "moving",   // phase de déplacement
    COMBAT: "combat",   // les deux joueurs sont adjacents
    OVER: "over"        // un joueur est tombé à 0 PV
} as const;

export type GamePhase = (typeof GAME_PHASES)[keyof typeof GAME_PHASES];

// ----- Directions -----
export type DirectionName = "up" | "down" | "left" | "right";

export interface Direction {
    readonly dx: number;
    readonly dy: number;
}

export const DIRECTIONS: Readonly<Record<DirectionName, Direction>> = {
    up:    { dx: -1, dy: 0 },
    down:  { dx: 1,  dy: 0 },
    left:  { dx: 0,  dy: -1 },
    right: { dx: 0,  dy: 1 }
};

export const DIRECTION_NAMES: readonly DirectionName[] = ["up", "down", "left", "right"];

// ----- Sélection des personnages (localStorage) -----
export const PLAYER1_STORAGE_KEY = "Dynedoc_player1";
export const PLAYER2_STORAGE_KEY = "Dynedoc_player2";

// ----- Personnages disponibles (images dans public/assets/characters/) -----
// `as const` : le tableau devient un tuple de littéraux, dont on dérive le type PlayerFile.
export const PLAYER_FILES = [
    "Jules.png",
    "Noah.png",
    "Wissem.png",
    "Charlie.png",
    "Hamza.png",
    "Faical.png",
    "Abdel.png",
    "Samuel.png"
] as const;

export type PlayerFile = (typeof PLAYER_FILES)[number];

// Garde de type : valide une valeur inconnue (ex. lue dans localStorage ou dans un <select>).
export const isPlayerFile = (value: unknown): value is PlayerFile =>
    typeof value === "string" && (PLAYER_FILES as readonly string[]).includes(value);
