import { join as pathJoin, sep as pathSeparator } from "./deps.ts";

// todo: provide defaults
// contains defaults, get overwritten when properly set
const con = {
    source: "inp",
    target: "outp",
    ignoredFilename: "_",
    ignoredDirname: "_",
    dataDirname: "_data",
    layoutDirname: "_layout",
    transformations: {
        ".md.html": [],
        ".css.css": []
    }
}

const configObject = {
    get input() {
        return con.input;
    },
    set input(val) {
        if (val !== "hi") {
            con.input = val;
        }
    }
};

// todo: validate
// - source/target is string, name only instead of path
// - ignoredFile/Dirname is string, name only instead of path
// - data/layoutDirname is string, name only instead of path

// pass configObject into modules, sets properties

// todo: read from CLI
const configPath = ".goose.js";

// todo: allow non-existent configFile
const relPath = "." + pathJoin(pathSeparator, configPath);
let configFile = undefined;
try {
    configFile = await import(relPath);
} catch (e) {
    throw new Error(`Config ${configPath} couldn't be imported. ${e.message}`);
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
    configFunc(configObject);
} catch (e) {
    throw new Error(`Config ${configPath} function threw an error. ${e.message}`);
}

console.log(input, output);

// todo: wrap all in function that is imported in mod.ts and return con

/
import { parse } from "./deps.ts";

const p = ".fd";
console.log(parse(p));

const config = {
    transforms: {
        ".html": [a => 3]
    },

    set transform(ext: string, func) {
        if (typeof ext != "string") {
            // todo: ignore, since ext must be string
        }
        if (ext.startsWith(".")) {
            // todo: ignore, ext not an ext because doesn't start with "."
        }
        if (ext.find(".")) {
            // todo: found another ".", is not an extension
        }
        //..., mayber just parse using path, rest will follow
    }
};

//