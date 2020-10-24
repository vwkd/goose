import { log } from "../logger.ts";
import {
    ensureDir,
    copy as copyFile,
} from "../deps.ts";
import type {BaseFile} from "../types.ts"

// todo: add desc, add type
// don't use return value, only for awaiting promise
export async function copy(file: BaseFile): Promise<void> {
    log.debug(`Copying: ${file.sourcePath} to ${file.targetPath} ...`);
    await ensureDir(file.targetDirectory);
    return copyFile(file.sourcePath, file.targetPath);
}

// todo: add desc, add type, File with content prop
// don't use return value, only for awaiting promise
export async function write(file: BaseFile, content: string): Promise<void> {
    log.debug(`Writing: ${file.sourcePath} to ${file.targetPath} ...`);
    await ensureDir(file.targetDirectory);
    return Deno.writeTextFile(file.targetPath, content);
}