import { log } from "./logger.ts";

export type Data = {
    [index: string]: any;
};

export type Options = {
    delimiter: string;
    parser: (string) => Data;
};

export type ParseResult = {
    content: string;
    data: Data;
};

/**
 * Parses the frontmatter of a string.
 * Returns an object with the parsed frontmatter as `data` and rest as `content`.
 * Throws an error if the delimiter is an empty string.
 * @param input string to parse
 * @param options object with properties `delimiter` and `parser`
 */
export function parse(input: string, options: Options): ParseResult {
    // basic input validation
    if (typeof input != "string") {
        throw new Error("Input must be a string.");
    }
    if (typeof options?.delimiter != "string") {
        throw new Error("Delimiter must be a string.");
    }
    if (typeof options?.parser != "function") {
        throw new Error("Parser must be a function.");
    }
    if (options.delimiter == "") {
        throw new Error("Delimiter must be non-empty string.");
    }

    // returns null if no match is found
    const REGEX = new RegExp(`^${options.delimiter}$(.*?)^${options.delimiter}$(.*)`, `ms`);
    const match = input.match(REGEX);

    // didn't get a match
    if (!match) {
        return { data: {}, content: "" };
    }

    // got a match, try parsing it
    else {
        let data = undefined;
        try {
            data = options.parser(match[1]);
        } catch (e) {
            log.error(`User provided frontmatter parser threw an error. ${e}`);
            throw new Error(`User provided frontmatter parser threw an error. ${e.message}`);
        }
        return { data: data, content: match[2] };
    }
}
