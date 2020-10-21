import {
    pathJoin,
    pathSeparator,
    pathParse,
    pathFormat,
    deepMergeArr
} from "./deps.ts";
import { log } from "./logger.ts";

// todo: add module name at beginning of error & log statements, because bubble up
// todo: export typescript type

export async function loadConfig(flags) {
    log.info("Load config started.");

    log.debug(`Config path: ${flags.configPath}`);

    const defaultConfigPath = ".goose.js";

    // contains defaults, get overwritten when properly set
    const defaultConfig = {
        source: "src",
        target: "dst",
        ignoredFilename: "_",
        ignoredDirname: "_",
        layoutDirname: "_layout",
        dataDirname: "_data",
        mergeFunction: deepMergeArr,
        transformations: {},
        targetPathTransformation: {},
        // incrementalBuild: false
    };

    // freeze such that user can't add properties by accident that then get silently ignored
    const configArgument = Object.freeze({
        get source() {
            return defaultConfig.source;
        },
        set source(val) {
            if (typeof val != "string") {
                throw new Error(`The source directory must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The source directory must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(`The source directory ${val} must not contain ".." path segments.`);
            }
            // disassemble and reassemble to make sure path is valid
            defaultConfig.source = pathFormat({ dir: path.dir, base: path.base });
        },

        get target() {
            return defaultConfig.target;
        },
        set target(val) {
            if (typeof val != "string") {
                throw new Error(`The target directory must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The target directory must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(`The target directory ${val} must not contain ".." path segments.`);
            }
            // disassemble and reassemble to make sure path is valid
            defaultConfig.target = pathFormat({ dir: path.dir, base: path.base });
        },

        get ignoredFilename() {
            return defaultConfig.ignoredFilename;
        },
        set ignoredFilename(val) {
            if (typeof val != "string") {
                throw new Error(`The ignoredFilename must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The ignoredFilename must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            // only takes base to discard any path segments
            defaultConfig.ignoredFilename = path.base;
        },

        get ignoredDirname() {
            return defaultConfig.ignoredDirname;
        },
        set ignoredDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The ignoredDirname must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The ignoredDirname must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            // only takes base to discard any path segments
            defaultConfig.ignoredDirname = path.base;
        },

        get dataDirname() {
            return defaultConfig.dataDirname;
        },
        set dataDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The dataDirname must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The dataDirname must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            // only takes base to discard any path segments
            defaultConfig.dataDirname = path.base;
        },

        get layoutDirname() {
            return defaultConfig.layoutDirname;
        },
        set layoutDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The layoutDirname must be a string.`);
            }
            if (val.trim() == "") {
                throw new Error(`The layoutDirname must be a non-empty non-whitespace-only string.`);
            }
            const path = pathParse(val);
            // only takes base to discard any path segments
            defaultConfig.layoutDirname = path.base;
        },

        get mergeFunction() {
            return defaultConfig.mergeFunction;
        },
        set mergeFunction(val) {
            // note: can't validate more without execution
            if (typeof val != "function") {
                throw new Error(`The mergeFunction must be a function.`);
            }
            defaultConfig.mergeFunction = val;
        },

        /*         get incrementalBuild() {
            return defaultConfig.incrementalBuild;
        },
        set incrementalBuild(val) {
            if (typeof val != "boolean") {
                throw new Error(`The incrementalBuild must be a boolean.`);
            }
            defaultConfig.incrementalBuild = val;
        }, */

        getTransformations(sourceExt, targetExt) {
            // returns array, or undefined if not found
            if (typeof sourceExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "getTransformations" must be strings.`);
            }
            return defaultConfig.transformations[sourceExt + targetExt];
        },

        setTransformations(sourceExt, targetExt, ...funcs) {
            // funcs is empty array if not enough arguments are provided

            // note: no validation if actually extensions, just won't find any matches later
            // just startWith check because of common error
            // todo: what if just provides "."?
            if (typeof sourceExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "setTransformations" must be strings.`);
            } else if (!sourceExt.startsWith(".") || !targetExt.startsWith(".")) {
                throw new Error(`The extension arguments of "setTransformations" must start with a ".".`);
            }

            // note: can't validate more without execution
            funcs.forEach(func => {
                if (typeof func != "function") {
                    throw new Error(`The function arguments of "setTransformations" must be functions.`);
                }
            });

            // ignore if funcs is empty array
            if (funcs.length > 0) {
                const entry = defaultConfig.transformations[sourceExt + targetExt];

                if (entry) {
                    entry.concat(funcs);
                } else {
                    defaultConfig.transformations[sourceExt + targetExt] = funcs;
                }
            }
        },

        getTargetPathTransformation(sourceExt, targetExt) {
            // returns function or undefined if not found
            if (typeof sourceExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "getTargetPathTransformation" must be strings.`);
            }
            return defaultConfig.targetPathTransformation[sourceExt + targetExt];
        },

        setTargetPathTransformation(sourceExt, targetExt, func) {
            // funcs is empty array if not enough arguments are provided

            // note: no validation if actually extensions, just won't find any matches later
            // just startWith check because of common error
            // todo: what if just provides "."?
            if (typeof sourceExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "setTargetPathTransformation" must be strings.`);
            } else if (!sourceExt.startsWith(".") || !targetExt.startsWith(".")) {
                throw new Error(`The extension arguments of "setTargetPathTransformation" must start with a ".".`);
            }

            // note: can't validate more without execution
            if (typeof func != "function") {
                throw new Error(`The function argument of "setTransformations" must be a function.`);
            }

            // overwrite any existing targetPathTransformation
            defaultConfig.targetPathTransformation[sourceExt + targetExt] = func;
        }
    });

    let configFile = undefined;

    // user path
    if (flags.configPath) {
        // validate
        // is already a string from argument parser
        if (flags.configPath.trim() == "") {
            throw new Error(`The config path must be a non-empty non-whitespace-only string.`);
        }
        const path = pathParse(flags.configPath);
        if (path.dir.split(pathSeparator).includes("..")) {
            throw new Error(`The config path ${flags.configPath} must not contain ".." path segments.`);
        }
        const relPath = "." + pathJoin(pathSeparator, flags.configPath);
        try {
            log.trace(`Importing user config ${relPath}...`);
            configFile = await import(relPath);
        } catch (e) {
            throw new Error(`Couldn't import config file ${flags.configPath}. ${e.message}`);
        }
    }

    // try default path
    else {
        const relPath = "." + pathJoin(pathSeparator, defaultConfigPath);
        try {
            log.trace(`Importing default config ${relPath}...`);
            configFile = await import(relPath);
        } catch (e) {
            // don't break if default doesn't exist
            if (e instanceof Deno.errors.NotFound) {
                return defaultConfig;
            }
            throw new Error(`Couldn't import config file ${defaultConfigPath}. ${e.message}`);
        }
    }

    const configFunc = configFile.default;
    // validation
    if (!configFunc) {
        throw new Error(`Config ${flags.configPath || defaultConfigPath} doesn't have a default export.`);
    }
    if (typeof configFunc != "function") {
        throw new Error(`Config ${flags.configPath || defaultConfigPath} default export must be a function.`);
    }

    // execute
    try {
        configFunc(configArgument);
    } catch (e) {
        throw new Error(`Config ${flags.configPath || defaultConfigPath} function threw an error. ${e.message}`);
    }

    log.info("Load config ended.");

    validateConfig(defaultConfig);

    return defaultConfig;
}

export function validateConfig(config) {
    if (config.source == config.target) {
        throw new Error(
            `The source directory ${config.source} must be different from the target directory ${config.target}.`
        );
    }
    if (config.layoutDirname == config.dataDirname) {
        throw new Error(
            `The layout directory ${config.layoutDirname} must be different from the data directory ${config.dataDirname}.`
        );
    }
}
