// Doit être chargé APRÈS js/Weapon.js (la classe Weapon doit exister).

const WEAPON_TYPES = [
    new Weapon("sword", "Knife", 15, "assets/weapons/sword.svg"),
    new Weapon("gun", "Gun", 20, "assets/weapons/gun-military.svg"),
    new Weapon("rocket", "Rocket", 50, "assets/weapons/missile.svg"),
    new Weapon("kalashnikov", "Kalashnikov", 25, "assets/weapons/kalashnikov.svg")
];

// L'arme de départ, équipée par les deux joueurs avant tout ramassage.
const DEFAULT_WEAPON = new Weapon("fists", "Poings", DEFAULT_WEAPON_DAMAGE, "assets/weapons/poings.svg");