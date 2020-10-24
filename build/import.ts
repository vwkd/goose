// todo: give path information, such that can print in error messages

import { log } from "../logger.ts";
import { pathJoin, pathSeparator, pathParse, pathFormat } from "../deps.ts";
import type { BaseFile, Global, Template, Layout, LayoutConfig, TemplateConfig, Data, Render } from "../types.ts";

/**
 * Loads data for global
 * @param file global to load
 * @returns mutated global with data property
 */
export async function loadGlobal(file: BaseFile): Promise<Global> {
    log.trace(`Loading global ${file.sourcePath}`);

    const globalModule = await importFile(file.sourcePath);

    const data = await getData(globalModule, "default");

    file.data = data;
    return file;
}

/**
 * Loads data, config and render for layout
 * @param file layout to load
 * @returns mutated layout with data, render and config properties
 */
export async function loadLayout(file: BaseFile): Promise<Layout> {
    log.trace(`Loading layout ${file.sourcePath}`);

    const layoutModule = await importFile(file.sourcePath);

    const data = await getData(layoutModule, "data");

    const configArgument = LayoutConfigArgument(file);
    await getConfig(layoutModule, "config", configArgument);

    const render = await getRender(layoutModule, "render");

    file.data = data;
    file.render = render;
    return file;
}

/**
 * Loads data, config and render for template
 * @param file template to load
 * @returns mutated template with data, render, config properties
 */
export async function loadTemplate(file: BaseFile): Promise<Template> {
    log.trace(`Loading template ${file.sourcePath}`);

    const templateModule = await importFile(file.sourcePath);

    const data = await getData(templateModule, "data");

    const configArgument = TemplateConfigArgument(file);
    await getConfig(templateModule, "config", configArgument);

    const render = await getRender(templateModule, "render");

    file.data = data;
    file.render = render;
    return file;
}

/**
 * Imports a module
 * @param path path of module
 * @returns imported module
 */
// todo: import path breaks if goose doesn't reside in same directory as the cwd
async function importFile(path: string): Promise<object> {
    log.trace(`Importing ${path}`);

    const relPath = ".." + pathJoin(pathSeparator, path);
    try {
        return await import(relPath);
    } catch (e) {
        throw new Error(`Import of ${path} failed. ${e.message}`);
    }
}

/**
 * Extracts the data from a module.
 * If it's a function, it's awaited return value is taken.
 * @param module module with a data property
 * @param key name of data property
 * @returns extracted data
 */
async function getData(module: object, key: string): Promise<Data> {
    log.trace(`Getting data.`);

    const dataObjectOrFunction = module?.[key];

    // allow falsy values (except undefined) as well
    if (dataObjectOrFunction === undefined) {
        console.warn(`Module doesn't have a data export. Won't use it.`);
    } else if (typeof dataObjectOrFunction == "function") {
        try {
            const data = await dataObjectOrFunction();

            if (data === "undefined") {
                console.warn(`Data function returned no data. Won't use it.`);
            }

            return data;
        } catch (e) {
            throw new Error(`Data function threw an error. ${e.message}`);
        }
    }

    return dataObjectOrFunction;
}

/**
 * Extracts the config function from a module.
 * Calls the function with a configArgument through which it mutates a file.
 * The function is awaited.
 * @param module module with a config property
 * @param key name of config property
 * @param configArgument argument through which the config function mutates a file
 */
async function getConfig(
    module: object,
    key: string,
    configArgument: Readonly<LayoutConfig> | Readonly<TemplateConfig>
): Promise<void> {
    log.trace(`Getting config.`);

    const configFunction = module?.[key];

    if (configFunction === undefined) {
        console.warn(`Module doesn't have a config export. Won't use it.`);
        return configFunction;
    } else if (typeof configFunction == "function") {
        try {
            return await configFunction(configArgument);
        } catch (e) {
            throw new Error(`Config function threw an error. ${e.message}`);
        }
    } else {
        throw new Error(`Config export must be a function.`);
    }
}

/**
 * Extracts the render function from a module.
 * @param module module with a render property
 * @param key name of render property
 * @returns extracted render function
 */
async function getRender(module: object, key: string): Promise<Render> {
    log.trace(`Getting render.`);

    const renderFunction = module?.[key];

    if (renderFunction === undefined) {
        console.warn(`Module doesn't have a render export. Won't use it.`);
        return renderFunction;
    } else if (typeof renderFunction == "function") {
        return renderFunction;
    } else {
        throw new Error(`Render export must be a function.`);
    }
}

/**
 * Creates the argument that is passed to the config function of a layout file.
 * The config function mutates the file through the argument.
 * @param file layout file that is mutated by the config function
 * @returns argument object that is passed to the config function
 */
function LayoutConfigArgument(file: BaseFile): Readonly<LayoutConfig> {
    return Object.freeze({
        // is undefined if not set
        get layoutPath() {
            return file.layoutPathRelative;
        },
        set layoutPath(val) {
            if (typeof val != "string") {
                throw new Error(`The layoutPath in layout ${file.sourcePath} must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(
                    `The layoutPath in layout ${file.sourcePath} must be a non-empty non-whitespace-only string.`
                );
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(
                    `The layoutPath ${val} in layout ${file.sourcePath} must not contain ".." path segments.`
                );
            }
            file.layoutPathRelative = pathFormat({ dir: path.dir, base: path.base });
        }
    });
}

/**
 * Create the argument that is passed to the config function of a template file.
 * The config function mutates the file through the argument.
 * @param file template file that is mutated by the config function
 * @returns argument object that is passed to the config function
 */
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
