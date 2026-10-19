class Weapon {
    constructor(id, name, damage, icon, x = null, y = null) {
        this._id = id;
        this._name = name;
        this._damage = damage;
        this._icon = icon; // chemin vers le SVG de l'arme
        this._x = x;       // position sur la carte (null si portée par un joueur)
        this._y = y;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get damage() {
        return this._damage;
    }

    get icon() {
        return this._icon;
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

    // Copie indépendante : chaque arme posée sur la carte a sa propre position.
    clone() {
        return new Weapon(this.id, this.name, this.damage, this.icon);
    }

    // Permet à GameMap.js de savoir comment afficher une arme posée au sol.
    render() {
        const image = document.createElement("img");
        image.classList.add("map__cell-sprite");
        image.src = this.icon;
        image.alt = this.name;
        return image;
    }
}