/**
 * Returns new string with first letter uppercase and rest lowercase
 * Returns undefined for empty string
 * @param str string to capitalise
 */
export function capitalise(str: string): string {
    if (str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    } else {
        return undefined;
    }
}

/**
 * Converts string "true" or "false" to boolean
 * Returns undefined for any other string
 * @param str string to convert to boolean
 */
export function booleanise(str: string): boolean {
    if (str === "true") {
        return true;
    } else if (str === "false") {
        return false;
    } else {
        return undefined;
    }
}
