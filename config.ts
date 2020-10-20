import { join as pathJoin, sep as pathSeparator, parse as pathParse } from "./deps.ts";
import { log } from "./logger.ts"

// todo: add module name at beginning of error & log statements, because bubble up

// todo: export typescript type

export async function loadConfig(configPath) {
    log.info("Load config started.");
    log.debug(`Config path: ${configPath}`)

    const defaultConfigPath = ".goose.js";

    // contains defaults, get overwritten when properly set
    const defaultConfig = {
        sourceDirname: "src",
        targetDirname: "dst",
        ignoredFilename: "_",
        ignoredDirname: "_",
        dataDirname: "_data",
        layoutDirname: "_layout",
        transformations: {
            ".md.html": [],
            ".css.css": []
        },
        incrementalBuild: false,
    };

    // docs: ignores any arguments that aren't defined
    // docs: can't directly manipulate config...
    // docs: source/target are directory names in cwd, only names not path
    // docs: data/layout are directory names in source, only names not path
    // docs: ignoredFilename/ignoredDirname are file/directory names in source, only names not path
    // docs: tranformation exts must start with ".", otherwise won't match later
    // docs: getTransformations returns array or undefined if not found
    // docs: incremental build

    // freeze such that user can't add properties by accident that then get silently ignored
    const configArgument = Object.freeze({
        get sourceDirname() {
            return defaultConfig.sourceDirname;
        },
        set sourceDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The sourceDirname must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.sourceDirname = path.base;
        },

        get targetDirname() {
            return defaultConfig.targetDirname;
        },
        set targetDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The targetDirname must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.targetDirname = path.base;
        },

        get ignoredFilename() {
            return defaultConfig.ignoredFilename;
        },
        set ignoredFilename(val) {
            if (typeof val != "string") {
                throw new Error(`The ignoredFilename must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.ignoredFilename = path.base;
        },

        get ignoredDirname() {
            return defaultConfig.ignoredDirname;
        },
        set ignoredDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The ignoredDirname must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.ignoredDirname = path.base;
        },

        get dataDirname() {
            return defaultConfig.dataDirname;
        },
        set dataDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The dataDirname must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.dataDirname = path.base;
        },

        get layoutDirname() {
            return defaultConfig.layoutDirname;
        },
        set layoutDirname(val) {
            if (typeof val != "string") {
                throw new Error(`The layoutDirname must be a string.`);
            }
            const path = pathParse(val);
            defaultConfig.layoutDirname = path.base;
        },

        getTransformations(srcExt, targetExt) {
            // returns array, or undefined if not found
            if (typeof srcExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "getTransformations" must be strings.`);
            }
            return defaultConfig.transformations[srcExt + targetExt];
        },

        setTransformations(srcExt, targetExt, ...funcs) {
            // funcs is empty array if not enough arguments are provided

            // note: no validation if actually extensions, just won't find any matches later
            // just startWith check because of common error
            if (typeof srcExt != "string" || typeof targetExt != "string") {
                throw new Error(`The extension arguments of "setTransformations" must be strings.`);
            } else if (!srcExt.startsWith(".") || !targetExt.startsWith(".")) {
                throw new Error(`The extension arguments of "setTransformations" must start with a ".".`);
            }

            // note: can't validate more without execution
            funcs.forEach(func => {
                if (typeof func != "function") {
                    throw new Error(`The function arguments of "setTransformations" must be functions.`);
                }
            });

            const entry = defaultConfig.transformations[srcExt + targetExt];

            // if entry exists (because would be array, is never falsy)
            if (entry) {
                entry.concat(funcs);
            }

            // also creates entry if only empty array
            else {
                defaultConfig.transformations[srcExt + targetExt] = funcs;
            }
        },

        get incrementalBuild() {
            return defaultConfig.incrementalBuild;
        },
        set incrementalBuild(val) {
            if (typeof val != "boolean") {
                throw new Error(`The incrementalBuild must be a boolean.`);
            }
            defaultConfig.incrementalBuild = val;
        },
    });

    let configFile = undefined;

    // user config path
    if (configPath) {
        const relPath = "." + pathJoin(pathSeparator, configPath);
        try {
            log.trace(`Importing user config ${relPath}...`)
            configFile = await import(relPath);
        } catch (e) {
            throw new Error(`Couldn't read config file ${configPath}. ${e.message}`);
        }
    }

    // default config path
    else {
        const relPath = "." + pathJoin(pathSeparator, defaultConfigPath);
        try {
            log.trace(`Importing default config ${relPath}...`)
            configFile = await import(relPath);
        } catch (e) {
            // don't break if default doesn't exist
            if (e instanceof Deno.errors.NotFound) {
                return defaultConfig;
            }
            throw new Error(`Couldn't read config file ${defaultConfigPath}. ${e.message}`);
        }
    }

    // validation
    if (!configFile.config) {
        throw new Error(`Config ${configPath} doen't export a config function.`);
    }
    if (typeof configFile.config != "function") {
        throw new Error(`Config ${configPath} config function must be a function.`);
    }
    const configFunc = configFile.config;

    // execute
    try {
        configFunc(configArgument);
    } catch (e) {
        throw new Error(`Config ${configPath} config function threw an error. ${e.message}`);
    }

    log.info("Load config ended.");

    return defaultConfig;
}

export function validateConfig(config) {
    if (config.sourceDirname == config.targetDirname) {
        throw new Error(
            `The sourceDirname ${defaultConfig.sourceDirname} must be different from the targetDirname ${defaultConfig.targetDirname}.`
        );
    }
}