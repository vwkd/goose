import { log } from "./deps.ts";
/**
 * Reads file.
 * Throws if doesn't exist or is a directory
 * @param filePath path of file that is read
 */
// todo: good idea to unwrap promise inside function just to wrap it again when returning it? yes, because contains errors to function...
async function readTextFile(filePath: string): Promise<string> {
    let file = undefined;
    try {
        log.debug(`Reading file ${filePath}...`);
        file = await Deno.readTextFile(filePath);
    } catch (e) {
        log.debug(e);
        throw new Error(`Couldn't read file ${filePath}. ${e.message}`);
    }
    return file;
}

/**
 * Writes data to file.
 * Throws if file already exists.
 * @param filePath path of file that is created
 * @param data text of content
 */
async function writeTextFileSafe(filePath: string, data: string): void {
    log.debug(`Writing file ${filePath} safely...`);
    let exi = false;
    try {
        log.debug(`Checking existence of file ${filePath}...`);
        exi = await exists(filePath);
    } catch (e) {
        log.debug(e);
        throw new Error(`Couldn't check file ${filePath}. ${e.message}`);
    }

    if (!exi) {
        try {
            log.debug(`Writing file ${filePath}...`);
            await Deno.writeTextFile(filePath, data);
        } catch (e) {
            log.debug(e);
            throw new Error(`Couldn't create file ${filePath}. ${e.message}`);
        }
    } else {
        throw new Error(`Didn't create file ${filePath} because it already exists.`);
    }
}

/**
 * Removes file or empty directory (or non-empty directory if recursive).
 * Throws if file or directory doesn't exist and if directory is non-empty if not recursive
 * @param filePath path of file that is removed
 * @param recursive true if path can be non-empty directory
 */
async function removeFile(filePath: string, recursive: boolean) {
    recursive = !!recursive;
    try {
        log.debug(`Removing ${recursive ? "directory" : "file"} ${filePath}...`);
        await Deno.remove(filePath, { recursive });
    } catch (e) {
        log.debug(e);
        throw new Error(
            `Couldn't delete ${recursive ? "directory" : "file"} ${filePath}. ${e.message}`
        );
    }
}

// todo: tests...
// readTextFile("src/das/").then(console.log).catch(console.error);
// removeFile("src/test.txt").catch(console.error);
// writeTextFileSafe("src/test.txt", "Hello World!").catch(console.log);


////// DELETE BELOW, DO MANUALLY

/**
 * Checks if 
 * @param filePath path 
 */
// async function doesExist(filePath: string): Promise<boolean> {
//     let exi = undefined;
//     try {
//         log.debug(`Checking existence of path ${filePath}...`);
//         exi = await exists(filePath);
//     } catch (e) {
//         log.debug(e);
//         throw new Error(`Couldn't check existence of path ${filePath}. ${e.message}`);
//     }
//     return exi;
// }

/**
 * Checks if directory (or file) exists and is a directory (or file)
 * @param filePath path of directory (or file)
 * @param shouldExist true if should exist
 * @param isDirectory true if should be directory
 */
// todo: good idea to mix existence and type check? if false doesn't know if because of existence or type, but doesn't need to add much logic to code (e.g. if exists, is also directory)
async function existsAndIsDirectory(
    filePath: string,
    shouldExist: boolean = true,
    isDirectory: boolean = true
): Promise<boolean> {
    let exi = undefined;
    try {
        log.debug(`Checking existence of ${isDirectory ? "directory" : "file"} ${filePath}...`);
        exi = await exists(filePath);
    } catch (e) {
        log.debug(e);
        throw new Error(
            `Couldn't check ${isDirectory ? "directory" : "file"} ${filePath}. ${e.message}`
        );
    }

    if (exi === shouldExist) {
        // exists when it should OR doesn't exist when it shouldn't
        if (exi) {
            // exists
            let info = undefined;
            try {
                log.debug(`Checking type of path ${filePath}...`);
                info = await Deno.lstat(filePath);
            } catch (e) {
                log.debug(e);
                throw new Error(`Couldn't check type of path ${filePath}. ${e.message}`);
            }

            if (info.isDirectory === isDirectory) {
                return true;
            } else {
                return false;
            }
        } else {
            // doesn't exist
            // doesn't matter what isDirectory is
            return true;
        }
    } else {
        // exists when it shouldn't OR doesn't exist when it should
        // doesn't matter what isDirectory is
        return false;
    }
}
// existsAndIsDirectory("src/testl", false, true).then(console.log).catch(console.log);

