// Récupère un élément par id ET vérifie son type : le retour est typé précisément
// (HTMLButtonElement, HTMLSelectElement...) sans cast `as`.
export const requireElement = <T extends HTMLElement>(id: string, type: new () => T): T => {
    const element = document.getElementById(id);

    if (!(element instanceof type)) {
        throw new Error(`Élément #${id} introuvable ou de type inattendu (${type.name} attendu).`);
    }

    return element;
};

export const queryRequired = <T extends HTMLElement = HTMLElement>(parent: ParentNode, selector: string): T => {
    const element = parent.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Élément "${selector}" introuvable.`);
    }

    return element;
};
