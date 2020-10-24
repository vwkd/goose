import { log } from "../logger.ts";
import { pathJoin, pathSeparator, pathParse, pathFormat } from "../deps.ts";
import type { BaseFile, Global, Template, Layout, LayoutConfig, TemplateConfig } from "../types.ts";

export async function loadGlobal(file: BaseFile): Promise<Global> {
    const globalModule = await importFile(file.sourcePath);

    const data = await getData(globalModule, "default");

    // TODO: can't copy, otherwise looses getter & setter, needed in targetPathTransformation
    // return { ...file, data };
    file.data = data;
    return file;
}

export async function loadLayout(file: BaseFile): Promise<Layout> {
    const layoutModule = await importFile(file.sourcePath);

    const data = await getData(layoutModule, "data");

    // modifies file directly
    // todo: compute new file with new properties, can type better
    const configArgument = LayoutConfigArgument(file);
    await getConfig(layoutModule, "config", configArgument);

    const render = await getRender(layoutModule, "render");

    // TODO: can't copy, otherwise looses getter & setter, needed in targetPathTransformation
    // return { ...file, data, render };
    file.data = data;
    file.render = render;
    return file;
}

export async function loadTemplate(file: BaseFile): Promise<Template> {
    const templateModule = await importFile(file.sourcePath);

    const data = await getData(templateModule, "data");

    // modifies file directly
    // todo: compute new file with new properties, can type better
    const configArgument = TemplateConfigArgument(file);
    await getConfig(templateModule, "config", configArgument);

    const render = await getRender(templateModule, "render");

    // TODO: can't copy, otherwise looses getter & setter, needed in targetPathTransformation
    // return { ...file, data, render };
    file.data = data;
    file.render = render;
    return file;
}

// beware: needs path relative to CWD!
// todo: implement properly relative path
async function importFile(path: string): Promise<object> {
    log.trace(`Importing ${path}`);

    const relPath = ".." + pathJoin(pathSeparator, path);
    try {
        return await import(relPath);
    } catch (e) {
        throw new Error(`Import of ${path} failed. ${e.message}`);
    }
}

// todo: what if obj itself is undefined
// gives data object at key, may be object or function that returns object
// todo: give path information, such that can print in error messages
// todo: use DataFunction = () => Promise<Data>;
async function getData(obj: object, key: string) {
    const dataObjectOrFunction = obj?.[key];

    // if no export or user explicitly exported undefined
    if (dataObjectOrFunction === undefined) {
        // todo: make more descriptive of data function
        console.warn(`Module doesn't have a data export. Will ignore.`);
    }

    // allows export of falsy values, even if probably get overwritten in merge since are primitive values that don't merge with objects
    else if (typeof dataObjectOrFunction == "function") {
        try {
            // await such that allows export async data function
            const data = await dataObjectOrFunction();

            // allows export of falsy values, even if probably get overwritten in merge since are primitive values that don't merge with objects
            if (data === "undefined") {
                console.warn(`Data function returned no data. Will ignore.`);
            }

            return data;
        } catch (e) {
            throw new Error(`Data function threw an error. ${e.message}`);
        }
    }

    return dataObjectOrFunction;
}

// todo: fix same problems as in getData
async function getConfig(obj: object, key: string, configArgument: Readonly<LayoutConfig> | Readonly<TemplateConfig>) {
    const configFunction = obj?.[key];

    // if no export or user explicitly exported undefined
    if (configFunction === undefined) {
        // todo: make more descriptive of config function
        console.warn(`Module doesn't export a config function. Will ignore.`);
        return configFunction;
    } else if (typeof configFunction == "function") {
        try {
            // await such that allows export async config function
            return await configFunction(configArgument);
        } catch (e) {
            throw new Error(`Config function threw an error. ${e.message}`);
        }
    } else {
        throw new Error(`Config function must be a function.`);
    }
}

async function getRender(obj: object, key: string) {
    const renderFunction = obj?.[key];

    // if no export or user explicitly exported undefined
    if (renderFunction === undefined) {
        // todo: make more descriptive of render function
        console.warn(`Module doesn't export a render function. Will ignore.`);
        return renderFunction;
    } else if (typeof renderFunction == "function") {
        return renderFunction;
    } else {
        throw new Error(`Render function must be a function.`);
    }
}

function LayoutConfigArgument(file: BaseFile): Readonly<LayoutConfig> {
    return Object.freeze({
        // is undefined if not set
        get layoutPath() {
            return file.layoutPathRelative;
        },
        set layoutPath(val) {
            if (typeof val != "string") {
                throw new Error(`The layoutPath in template ${file.sourcePath} must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(
                    `The layoutPath in template ${file.sourcePath} must be a non-empty non-whitespace-only string.`
                );
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(
                    `The layoutPath ${val} in template ${file.sourcePath} must not contain ".." path segments.`
                );
            }
            file.layoutPathRelative = pathFormat({ dir: path.dir, base: path.base });
        }
    });
}

function TemplateConfigArgument(file: BaseFile): Readonly<TemplateConfig> {
    return Object.freeze({
        get targetPath() {
            return file.targetPathRelative;
        },
        set targetPath(val) {
            if (typeof val != "string") {
                throw new Error(`The targetPath in template ${file.sourcePath} must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(
                    `The targetPath in template ${file.sourcePath} must be a non-empty non-whitespace-only string.`
                );
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(
                    `The targetPath ${val} in template ${file.sourcePath} must not contain ".." path segments.`
                );
            }
            file.targetPathRelative = pathFormat({ dir: path.dir, base: path.base });
        },

        // returns undefined if not set
        get layoutPath() {
            return file.layoutPathRelative;
        },
        set layoutPath(val) {
            if (typeof val != "string") {
                throw new Error(`The layoutPath in template ${file.sourcePath} must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(
                    `The layoutPath in template ${file.sourcePath} must be a non-empty non-whitespace-only string.`
                );
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(
                    `The layoutPath ${val} in template ${file.sourcePath} must not contain ".." path segments.`
                );
            }
            file.layoutPathRelative = pathFormat({ dir: path.dir, base: path.base });
        }
    });
}
