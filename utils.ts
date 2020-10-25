/**
 * Returns new string with first letter uppercase and rest lowercase
 * @param str string to capitalise, undefined is allowed
 * @returns capitalised string, undefined for empty string or undefined
 */
export function capitalise(str: string | undefined): string | undefined {
    if (str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else {
        return undefined;
    }
}

/**
 * Converts string "true" or "false" to boolean
 * @param str string to convert to boolean, undefined is allowed
 * @returns boolean if str is "true" or "false", undefined for any other string or undefined
 */
export function booleanise(str: string | undefined): boolean | undefined {
    if (str.toUpperCase() === "true") {
        return true;
    } else if (str.toLowerCase() === "false") {
        return false;
    } else {
        return undefined;
    }
}
