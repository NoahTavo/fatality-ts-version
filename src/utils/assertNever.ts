// Garde d'exhaustivité : si une union discriminée évolue (nouvelle phase, par exemple),
// TypeScript signale à la compilation tous les `switch` qui ne la traitent pas.
export const assertNever = (value: never): never => {
    throw new Error(`Cas non géré : ${JSON.stringify(value)}`);
};
