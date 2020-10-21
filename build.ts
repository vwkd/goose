// todo: add module name at beginning of error & log statements, because bubble up
// todo: add helper notice to user at beginning of error statements to notice where it broke

import { log } from "./logger.ts";
import {
    exists,
    ensureDir,
    walk,
    copy,
    parse as pathParse,
    format as pathFormat,
    sep as pathSeparator,
    join as pathJoin,
    extname as pathExtname,
    relative as pathRelative,
    createHash,
    walkChainIdCall,
    walkChainIdMerge
} from "./deps.ts";

// todo: respect verbose and quiet options

/**
 * Heart of application.
 * Builds files from options.
 * @param config options to build
 */
export async function build(config, flags) {
    log.info("Build started.");
    log.debug(`Build options: ${JSON.stringify(config)}`);
    log.debug(`Build flags: ${JSON.stringify(flags)}`);

    const startTime = performance.now();

    // ------ validate directories ------
    const sourceFolderExists = await exists(config.source);

    if (!sourceFolderExists) {
        throw new Error(`Source folder ${config.source} doesn't exist.`);
    }

    if (!flags.dryrun) {
        const targetFolderExists = await exists(config.target);

        // beware: in meantime user could create target folder, overwrites because no second check before writing
        if (!config.incrementalBuild && targetFolderExists) {
            throw new Error(`Target folder ${config.target} already exists.`);
        } else if (config.incrementalBuild && !targetFolderExists) {
            console.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead.`);
        }
    }

    // ------ load file list ------
    // templates are rendered, assets are copied, rest is ignored
    const files = { templates: [], assets: [], ignored: [], layouts: [], globaldata: [] };

    const dataDirectory = pathJoin(config.source, config.dataDirname);
    const layoutDirectory = pathJoin(config.source, config.layoutDirname);

    try {
        for await (const item of walk(config.source, { includeDirs: false })) {
            
            const _sourcePath = item.path;
            const { dir: _dir, ext: _ext, name: _name, base: _base } = pathParse(_sourcePath);
            const _sourceDirectory = _dir;

            const _sourcePathRelative = pathRelative(config.source, _sourcePath);
            const _sourceDirectoryRelative = pathRelative(config.source, _sourceDirectory);
            
            const file = {
                sourcePath: _sourcePath,
                sourcePathRelative: _sourcePathRelative,
                sourceDirectory: _sourceDirectory,
                sourceDirectoryRelative: _sourceDirectoryRelative,
                sourceExtension: _ext,
                sourceName: _name,
                sourceBase: _base
            };

            const [sourcePathRelativeFirst, ...sourcePathRelativeRestArr] = file.sourcePathRelative.split(pathSeparator);
            const [sourceDirectoryRelativeFirst, ...sourceDirectoryRelativeRestArr] = file.sourceDirectoryRelative.split(pathSeparator);

            // ignored filename
            if (file.sourceName.startsWith(config.ignoredFilename)) {
                log.trace(`File is ignored because of filename: ${item.path}`);
                files.ignored.push(file);
            }

            // layout directory
            else if (sourceDirectoryRelativeFirst == config.layoutDirname) {
                if (sourceDirectoryRelativeRestArr.some(str => str.startsWith(config.ignoredDirname))) {
                    log.trace(`File is ignored because of directory name: ${item.path}`);
                    files.ignored.push(file);
                } else {
                    log.trace(`File is layout because of directory: ${item.path}`);
                    // const [_c, ...sourcePathRelativeRestArr] = sourcePathRelativeArr;
                    file.sourcePathRelativeToLayout = sourcePathRelativeRestArr.join(pathSeparator);
                    files.layouts.push(file);
                }
            }

            // data directory
            else if (sourceDirectoryRelativeFirst == config.dataDirname) {
                if (sourceDirectoryRelativeRestArr.some(str => str.startsWith(config.ignoredDirname))) {
                    log.trace(`File is ignored because of directory name: ${item.path}`);
                    files.ignored.push(file);
                } else {
                    log.trace(`File is global data because of directory: ${item.path}`);
                    files.globaldata.push(file);
                }
            }

            // ignored directory
            // after check for dataDirectory and layoutDirectory such that they can use ignoredFilename
            else if (file.sourceDirectory.split(pathSeparator).some(str => str.startsWith(config.ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                files.ignored.push(file);
            }

            // JavaScript file
            else if (file.sourceExtension == ".js") {
                // because name ends on second extension
                // note: pathExtname returns empty string if single "." is first character, i.e. a nameless files like ".css.js" or ". .js" or "..js" are handled as asset
                const secondExtension = pathExtname(file.sourceName);
                if (secondExtension) {
                    log.trace(`File is template because of double "${secondExtension}.js" extension: ${item.path}`);
                    // outputted, but compute targetPath later when knows permalink from local properties
                    file.sourceExtension = secondExtension;
                    file.sourcePathRelativeWithoutJsExtension = pathJoin(file.sourceDirectoryRelative, file.sourceName);
                    files.templates.push(file);
                } else {
                    log.trace(`File is asset because of single ".js" extension: ${item.path}`);
                    // outputted, compute targetPath now because won't change later
                    file.targetPath = pathJoin(config.target, file.sourcePathRelative);
                    file.targetDirectory = pathJoin(config.target, file.sourceDirectoryRelative);
                    files.assets.push(file);
                }
            }

            // everything else
            else {
                log.trace(`File is asset because everything else: ${item.path}`);
                // outputted, compute targetPath now because won't change later
                file.targetPath = pathJoin(config.target, file.sourcePathRelative);
                file.targetDirectory = pathJoin(config.target, file.sourceDirectoryRelative);
                files.assets.push(file);
            }
        }
    } catch (e) {
        // todo:
        console.log(e);
    }

    // ------ copy assets ------
    // start copy as early as possible to give time
    // don't await here to allow for concurrency with rest of build, await whole build itself
    // todo: does awaiting build work for non-awaited files??
    // maybe needs to push into array and await at end of build using `await Promise.all[]` ??
    if (!flags.dryrun) {
        copyFiles(files.assets);
    }

    // ------ load global data ------

    const globalDataArr = [];

    // no restrictions of imported value (or return type of function), will just get merged away if not a normal object
    // todo: make robust, what does do with complex values...
    for (const file of files.globaldata) {
        const relPath = "." + pathJoin(pathSeparator, file.sourcePath);

        let dataFile = undefined;
        try {
            dataFile = await import(relPath);
        } catch (e) {
            throw new Error(`Global data file ${file.sourcePath} couldn't be imported. ${e.message}`);
        }

        const defaultExport = dataFile.default;
        if (defaultExport) {
            if (typeof defaultExport == "function") {
                let unwrapped = undefined;
                try {
                    unwrapped = await defaultExport();
                } catch (e) {
                    throw new Error(
                        `Default export function of global data file ${file.sourcePath} threw an error. ${e.message}`
                    );
                }
                globalDataArr.push(unwrapped);
            } else {
                globalDataArr.push(defaultExport);
            }
        } else {
            console.warn(`Global data file ${file.sourcePath} doesn't have a default export. Will ignore.`);
        }
    }

    log.debug(`Unmerged global data: ${JSON.stringify(globalDataArr)}`);

    const globalData = config.mergeFunction({}, ...globalDataArr);

    log.debug(`Merged global data: ${JSON.stringify(globalData)}`);

    // ------ load layouts ------
    // loads all layouts into memory, assumes there are not many and instead much more templates

    for (const file of files.layouts) {
        log.debug(`--- Process layout ${file.sourcePath} ---`);
        // todo: make robust, how does import function, what does do with complex values...
        const relPath = "." + pathJoin(pathSeparator, file.sourcePath);
        let layout = undefined;
        try {
            layout = await import(relPath);
        } catch (e) {
            throw new Error(`Layout ${file.sourcePath} couldn't be imported. ${e.message}`);
        }

        if (!layout.render) {
            throw new Error(`Layout ${file.sourcePath} doen't export a render function.`);
        }
        if (typeof layout.render != "function") {
            throw new Error(`Layout ${file.sourcePath} render function must be a function.`);
        }
        file.render = layout.render;

        if (!layout.data) {
            log.warn(`Layout ${file.sourcePath} doen't export a data function.`);
        }
        else if (typeof layout.data != "function") {
            throw new Error(`Layout ${file.sourcePath} data function must be a function.`);
        }

        const dataArgument = Object.freeze({
            // is undefined if not set
            get layoutPath() {
                return file.layoutPathRelative;
            },
            set layoutPath(val) {
                if (typeof val != "string") {
                    throw new Error(`The layoutPath in template ${file.sourcePath} must be a string.`);
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

        // note: no validation on data, user has to deal with a useful/-less merge
        try {
            // await just incase data function is async
            // allow data being undefined
            file.data = layout.data?.(dataArgument);
        } catch (e) {
            throw new Error(`Layout ${file.sourcePath} data function threw an error. ${e.message}`);
        }
        log.debug(`Layout data: ${JSON.stringify(file.data)}`);

        // ---------- compute data properties ----------
        // merge layout data up to global object now instead of with each template
        // saves computations when multiple template reuse the same layout

        // todo: warn for non-existent layout due to wrong file.layoutPathRelative
        // todo: warn for layout with cyclical dependency

        const layoutData = walkChainIdMerge({
            startNode: file,
            nodeList: files.layouts,
            linkName: "layoutPathRelative",
            idName: "sourcePathRelativeToLayout",
            mergeProperty: "data",
            mergeFunction: config.mergeFunction
        });

        log.debug(`Merged data: ${JSON.stringify(layoutData)}`);

        // don't merge local data if undefined
        const layoutAndGlobalData = layoutData ? config.mergeFunction(globalData, layoutData) : globalData;

        log.debug(`Merged and global data: ${JSON.stringify(layoutAndGlobalData)}`);

        file.dataMerged = layoutAndGlobalData;
    }

    // ------ process templates ------

    // process and write all in single pass
    for (const file of files.templates) {
        log.debug(`--- Process template ${file.sourcePath} ---`);

        // todo: make robust, don't save content in memory as object property, instead for each file compute everything and write out immediately

        // todo: improve processing flow, factor out step into own functions, only call if needs, e.g. transformations isn't undefined, etc.

        // ---------- load template ----------

        // todo: make robust, how does import function, what does do with complex values...
        let templateFile = undefined;

        const relPath = "." + pathJoin(pathSeparator, file.sourcePath);
        try {
            templateFile = await import(relPath);
        } catch (e) {
            throw new Error(`Template ${file.sourcePath} couldn't be imported. ${e.message}`);
        }

        if (!templateFile.render) {
            throw new Error(`Template ${file.sourcePath} doen't export a render function.`);
        }
        if (typeof templateFile.render != "function") {
            throw new Error(`Template ${file.sourcePath} render function must be a function.`);
        }
        file.render = templateFile.render;

        if (!templateFile.data) {
            log.warn(`Template ${file.sourcePath} doen't have a named export 'data'.`);
        } else if (typeof templateFile.data != "function") {
            throw new Error(`Template ${file.sourcePath} data function must be a function.`);
        }

        // gets overwritten by dataArgument if sets "targetPath"
        file.targetPathRelative = file.sourcePathRelativeWithoutJsExtension;

        const dataArgument = Object.freeze({
            get targetPath() {
                return file.targetPathRelative;
            },
            set targetPath(val) {
                if (typeof val != "string") {
                    throw new Error(`The targetPath in template ${file.sourcePath} must be a string.`);
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
                const path = pathParse(val);
                if (path.dir.split(pathSeparator).includes("..")) {
                    throw new Error(
                        `The layoutPath ${val} in template ${file.sourcePath} must not contain ".." path segments.`
                    );
                }
                file.layoutPathRelative = pathFormat({ dir: path.dir, base: path.base });
            }
        });

        // note: no validation on data, user has to deal with a useful/-less merge
        try {
            // await just incase data function is async
            // allow data being undefined
            file.data = templateFile.data?.(dataArgument);
        } catch (e) {
            throw new Error(`Template ${file.sourcePath} data function threw an error. ${e.message}`);
        }
        log.debug(`Template data: ${JSON.stringify(file.data)}`);

        // todo: check for duplicate targetPaths, can't have two files with identical targetPaths
        file.targetPath = pathJoin(config.target, file.targetPathRelative);
        const { dir, ext, name, base } = pathParse(file.targetPathRelative);
        file.targetDirectoryRelative = dir;
        file.targetDirectory = pathJoin(config.target, file.targetDirectoryRelative);
        // may be empty if used permalink which didn't have extension
        file.targetExtension = ext;
        file.targetName = name;
        file.targetBase = base;

        log.debug(`File: ${JSON.stringify(file)}`);

        // ---------- compute data properties ----------

        // todo: warn for non-existent layout due to wrong file.layoutPathRelative
        // todo: warn for layout with cyclical dependency

        let templateData = undefined;

        // has layout, use precomputed merged data and merge with own
        if (file.layoutPathRelative) {
            // if exists is unique because files on file system are unique
            const layout = files.layouts.find(lay => {
                return file.layoutPathRelative == lay.sourcePathRelativeToLayout;
            });

            if (layout) {
                // global data was merged with layout data already
                // don't merge local data if undefined
                templateData = file.data ? config.mergeFunction(layout.dataMerged, file.data) : layout.dataMerged;

            } else {
                // console.warn(`Couldn't find layout ${file.layoutPathRelative} for template ${file.sourcePath}. Won't use its data it.`)
                // don't merge local data if undefined
                templateData = file.data ? config.mergeFunction(layout.dataMerged, file.data) : layout.dataMerged;
            }
        }

        // has no layout, just merge in global data
        else {
            // don't merge local data if undefined
            templateData = file.data ? config.mergeFunction(globalData, file.data) : globalData;
        }

        log.debug(`Merged template data: ${JSON.stringify(templateData)}`);

        // ---------- render ----------

        // todo: warn for non-existent layout due to wrong file.layoutPathRelative
        // todo: warn for layout with cyclical dependency

        function tryRender(node, lastValue, data) {
            let str = undefined;
            try {
                // await just incase render function is async
                str = node.render(data, lastValue);
            } catch (e) {
                throw new Error(`Template ${node.sourcePath} render function threw an error. ${e.message}`);
            }
            if (typeof str != "string") {
                throw new Error(`Template ${node.sourcePath} render function must return a string.`);
            }
            return str;
        }

        const renderedContent = walkChainIdCall({
            startNode: file,
            nodeList: files.layouts,
            linkName: "layoutPathRelative",
            idName: "sourcePathRelativeToLayout",
            callback: tryRender,
            data: templateData
        });

        log.debug(`Rendered content: ${JSON.stringify(renderedContent)}`);

        // ---------- transform ----------

        // may be undefined if none were added, or may be empty if `.setTransformations` was called without a function argument
        const transformations = config.transformations[file.sourceExtension + file.targetExtension];

        // if transformations is empty, returns initial value renderedContent
        // if transformations itself is undefined, defaults to renderedContent
        const transformedContent =
            transformations?.reduce((acc, transform) => {
                const str = transform(acc);
                if (typeof str != "string") {
                    throw new Error(`The transformation "${transform.name || "(anonymous)"}" must return a string.`);
                }
                return str;
            }, renderedContent) ?? renderedContent;
        log.debug(`Transformed content: ${JSON.stringify(transformedContent)}`);

        // ---------- write out ----------

        if (!flags.dryrun) {
            // don't await, runs concurrently
            writeFile(file.targetPath, file.targetDirectory, transformedContent);
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = files.templates.length + files.assets.length;
    console.log(`Successfully build ${amount.toLocaleString()} ${amount == 1 ? "file" : "files"} in ${duration}s.`);

    log.info("Build ended.");
}

async function copyFiles(files) {
    for (const file of files) {
        log.debug(`Copying: ${file.targetPath}...`);
        await ensureDir(file.targetDirectory);
        await copy(file.sourcePath, file.targetPath);
    }
}

async function writeFile(path, directory, content) {
    log.debug(`Writing: ${path}...`);
    await ensureDir(directory);
    await Deno.writeTextFile(path, content);
}
