import { exists } from "./deps.ts";

// mainObject = { files, config, globalData, templates }

// main Worker
// takes config as argument, writes files to disk

function main(config) {

// -- check permissions
// read output dir, ensure doesn't exist [until incremental build enabled]
// (beware: in meantime until writes output could create, would be overwritten then)
// read source dir, throw error if not possible

if (await exists(config.target)) {
    throw new Error(`Target folder already exists.`);
}

if (!(await exists(config.source))) {
    throw new Error(`Source folder doesn't exist.`);
}

// -- build file list
// walk source dir, build array of file info objects ("files"), e.g. file path
// walk source dir, add file hashes to file info [for incremental, later]
// repeat for file, add outputAction = "process" | "copy" | "ignore" based on file path and extension
//   if folder starts with X => "ignored", break (i.e. _somefolder, also _includes, i.e. templates)
//   if filename starts with Y => "ignored", break (i.e. _somefile)
//   if file type is processed => "process"
//   else => "copy" (i.e. assets)
// FEAT: better than globs, because can only select, not negate, not do multiple actions depending on outcome

// -- build global data
// walk data dir, add data to globalData, beware: identical property names overwrite each other
// (todo: optimise, walks dir again what is already in mainObject.files)

// -- compute properties
// walk dependency tree from top to bottom, compute local properties of each file
// FEAT: efficient, because computes properties for every file only once

// -- build dependency tree
// repeat for file with outputAction = "process", build dependency chain from "includes" relationship
//   if has "template" local property (path is relative to template dir!)
//      build single dependency chain of hashes {"X": { "YY": { "aaa": null } } }
//         ... recursively until no more "template" local property
//         (todo: throw error if template file doesn't exist)
//         (todo: throw error if cyclic, build in cyclic check)
// add each dependency chain to dependency tree, deep merging
/*
{
    "X": {
        "YY": {
            "aaa": undefined,
            "bbb": undefined
        },
        "ZZ": {
            "ccc": undefined,
            "ddd": undefined
        }
    }
}
*/
// add each file with outputAction = "copy" as well to top level ?? CONFLICT WITH TEMPLATE NAME, WHY NOT SEPARATE
// FEAT: ignores templates that aren't referenced anywhere

// -- build deletion dependency tree
// repeat for each leaf of dependency tree
//   create add outputPath: inputPath to object

// repeat for each leaf of dependency tree
// aggregate bodies
// aggregate properties
// process aggregateFile with aggregateProperties with template engine (EJS)

// repeat for file with outputAction = "process"
// if has file type that is transformed, e.g. `.md`
//   for each transformation engine (MARKDOWN, MINIFY, ETC.)
//      process file with transformation engine
// write file to data.outputPath (creating intermediary paths)

// repeat for file with outputAction = "copy"
// if has file type that is transformed, e.g. `.md`
//   for each transformation engine (MARKDOWN, MINIFY, ETC.)
//      process file with transformation engine
// write file to data.outputPath (creating intermediary paths)


// TODO: incremental build
// on initial build, build dependency graph / tree from connection of templates and content hashes
//      beware: does not rely on file paths !
// on next build (with existing output depdendency tree), just compare, flag the changed ones for rebuild / deletion

// TODO:
// - add folder-wide data files
// - Q: can a template itself be outputted ? NO, WHAT WOULD CONTENT BE...

}