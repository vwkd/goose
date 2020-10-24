import { pathJoin, pathSeparator, pathParse, pathFormat, deepMergeArr, exists } from "./deps.ts";
import { log } from "./logger.ts";
import type { Flags, Transformation, ConfigFunction, Config, ConfigArgument } from "./types.ts";

// todo: add module name at beginning of error & log statements, because bubble up
// todo: export typescript type

// contains defaults, get overwritten when properly set
const defaultConfig: Config = {
    source: "src",
    target: "dst",
    ignoredFilename: "_",
    ignoredDirname: "_",
    layoutDirname: "_layout",
    dataDirname: "_data",
    mergeFunction: deepMergeArr,
    transformations: {},
    targetPathTransformation: {}
    // incrementalBuild: false
};

const defaultConfigPath: string = ".goose.js";

// freeze such that user can't add properties by accident that then get silently ignored
const configArgument: ConfigArgument = Object.freeze({
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

    getTransformations(sourceExt: string, targetExt: string): Transformation[] | undefined {
        // returns array, or undefined if not found
        if (typeof sourceExt != "string" || typeof targetExt != "string") {
            throw new Error(`The extension arguments of "getTransformations" must be strings.`);
        }
        return defaultConfig.transformations[sourceExt + targetExt];
    },

    setTransformations(sourceExt: string, targetExt: string, ...funcs: Transformation[]): void {
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

    getTargetPathTransformation(sourceExt: string, targetExt: string): Transformation | undefined {
        // returns function or undefined if not found
        if (typeof sourceExt != "string" || typeof targetExt != "string") {
            throw new Error(`The extension arguments of "getTargetPathTransformation" must be strings.`);
        }
        return defaultConfig.targetPathTransformation[sourceExt + targetExt];
    },

    setTargetPathTransformation(sourceExt: string, targetExt: string, func: Transformation) {
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

export async function getConfig(flags: Flags): Promise<Config> {
    log.info("Config started.");

    log.debug(`Using arguments: ${JSON.stringify(flags)}`);

    // use config path if provided
    // also filters out the case that it's an empty string
    if (flags.configPath) {
        log.trace(`Load provided config path. ${flags.configPath}`);

        // is already a string from argument parser
        if (flags.configPath.trim() == "") {
            throw new Error(`The config path must be a non-empty non-whitespace-only string.`);
        }
        const path = pathParse(flags.configPath);
        if (path.dir.split(pathSeparator).includes("..")) {
            throw new Error(`The config path ${flags.configPath} must not contain ".." path segments.`);
        }

        await loadConfig(flags.configPath, configArgument);
    }

    // else try if default path exists
    else if (await exists(defaultConfigPath)) {
        log.trace(`Load default config path. ${defaultConfigPath}`);
        await loadConfig(defaultConfigPath, configArgument);
    }

    // else use default config unmodified
    else {
        log.trace(`Use default config.`);
    }

    log.info("Config ended.");

    return defaultConfig;
}

async function loadConfig(path: string, configArgument: ConfigArgument): Promise<void> {
    let configFile: { default?: ConfigFunction } | undefined = undefined;

    const relPath = "." + pathJoin(pathSeparator, path);
    try {
        log.trace(`Importing config ${relPath}...`);
        configFile = await import(relPath);
    } catch (e) {
        console.log(e);
        throw new Error(`Couldn't import config file ${path}. ${e.message}`);
    }

    const configFunc = configFile?.default;
    // validation
    if (!configFunc) {
        throw new Error(`Config ${path} doesn't have a default export.`);
    }
    if (typeof configFunc != "function") {
        throw new Error(`Config ${path} default export must be a function.`);
    }

    // execute
    try {
        configFunc(configArgument);
    } catch (e) {
        throw new Error(`Config ${path} function threw an error. ${e.message}`);
    }

    validateConfig(defaultConfig);
}

function validateConfig(config: Config): void {
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
