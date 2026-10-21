
export const assertNever = (value: never): never => {
    throw new Error(`Cas non géré : ${JSON.stringify(value)}`);
};
