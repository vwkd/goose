// todo: add module name at beginning of error & log statements, because bubble up
// todo: add helper notice to user at beginning of error statements to notice where it broke
// todo: respect quiet option, maybe also verbose (or should just us˝e log?)

import { log } from "./logger.ts";
import {
    exists,
    ensureDir,
    walk,
    copy,
    pathParse,
    pathFormat,
    pathSeparator,
    pathJoin,
    pathExtname,
    pathRelative,
    walkChainIdCall,
    walkChainIdMerge
} from "./deps.ts";
import type { Flags, Config } from "./types.ts";

export async function build(config: Config, flags: Flags) {
    log.info("Build started.");
    log.debug(`Build options: ${JSON.stringify(config)}`);
    log.debug(`Build flags: ${JSON.stringify(flags)}`);

    const startTime = performance.now();

    // ------ validate directories ------

    log.trace("... Validating directories ...");

    const sourceFolderExists = await exists(config.source);

    if (!sourceFolderExists) {
        throw new Error(`Source folder ${config.source} doesn't exist.`);
    }

    if (!flags.dryrun) {
        const targetFolderExists = await exists(config.target);

        // beware: in meantime during build user could create target folder, overwrites because no second check before writing
        if (/* !config.incrementalBuild && */ targetFolderExists) {
            throw new Error(`Target folder ${config.target} already exists. Please delete or use incremental build instead.`);
        } else if (/* config.incrementalBuild && */ !targetFolderExists) {
            console.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`);
            log.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`);
        }
    }

    // ------ load file list ------

    log.trace("... Loading file list ...");

    // todo: maybe factor out into standalone arrays
    const files: FileList = { templates: [], assets: [], ignored: [], layouts: [], globals: [] };

    try {
        for await (const item of walk(config.source, { includeDirs: false })) {
            const file = makeFileObject(config.source, config.target, item.path);

            if (file.sourceName.startsWith(config.ignoredFilename)) {
                log.trace(`File is ignored because of filename: ${item.path}`);
                files.ignored.push(file);
            }

            else if (file.sourceDirectoryRelativeFirstSegment == config.layoutDirname) {
                if (file.sourceDirectoryRelativeRestSegment.some(str => str.startsWith(config.ignoredDirname))) {
                    log.trace(`File is ignored because of directory name: ${item.path}`);
                    files.ignored.push(file);
                } else {
                    log.trace(`File is layout because of directory name: ${item.path}`);
                    files.layouts.push(file);
                }
            }

            else if (file.sourceDirectoryRelativeFirstSegment == config.dataDirname) {
                if (file.sourceDirectoryRelativeRestSegment.some(str => str.startsWith(config.ignoredDirname))) {
                    log.trace(`File is ignored because of directory name: ${item.path}`);
                    files.ignored.push(file);
                } else {
                    log.trace(`File is global data because of directory name: ${item.path}`);
                    files.globals.push(file);
                }
            }

            // after check for dataDirectory and layoutDirectory such that they can use ignoredFilename
            else if (file.sourceDirectory.split(pathSeparator).some(str => str.startsWith(config.ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                files.ignored.push(file);
            }

            else if (file.sourceExtension == ".js") {
                if (file.sourceExtensionSecond) {
                    log.trace(`File is template because of double "${file.sourceExtensionSecond}.js" extension: ${item.path}`);            
                    // effectively strips trailing .js extension from targetPath
                    file.targetExtension = "";
                    files.templates.push(file);
                } else {
                    log.trace(`File is asset because of single ".js" extension: ${item.path}`);
                    files.assets.push(file);
                }
            }

            // everything else
            else {
                log.trace(`File is asset because everything else: ${item.path}`);
                files.assets.push(file);
            }
        }
    } catch (e) {
        throw new Error(`Couldn't build file list. ${e.message}`);
    }

    // ------ copy assets ------

    log.trace("... Copying assets ...");

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
    for (const file of files.globals) {
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
        } else if (typeof layout.data != "function") {
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

        // don't use local data if undefined
        const layoutAndGlobalData = layoutData ? config.mergeFunction(globalData, layoutData) : globalData;

        log.debug(`Merged and global data: ${JSON.stringify(layoutAndGlobalData)}`);

        file.dataMerged = layoutAndGlobalData;
    }

    // ------ process templates ------

    // beware: since writes out templates before proceeding to next, can't check if same targetPath is set on multiple templates, will overwrite instead

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

        const dataArgument = Object.freeze({
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

        // note: no validation on data, user has to deal with a useful/-less merge
        try {
            // await just incase data function is async
            // allow data being undefined
            file.data = templateFile.data?.(dataArgument);
        } catch (e) {
            throw new Error(`Template ${file.sourcePath} data function threw an error. ${e.message}`);
        }
        log.debug(`Template data: ${JSON.stringify(file.data)}`);

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
                // don't use local data if undefined
                templateData = file.data ? config.mergeFunction(layout.dataMerged, file.data) : layout.dataMerged;
            } else {
                // console.warn(`Couldn't find layout ${file.layoutPathRelative} for template ${file.sourcePath}. Won't use its data it.`)
                // don't use local data if undefined
                templateData = file.data ? config.mergeFunction(layout.dataMerged, file.data) : layout.dataMerged;
            }
        }

        // has no layout, just merge in global data
        else {
            // don't use local data if undefined
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

        // may be undefined if none was added
        // targetExtension may be empty if user provided targetPath in template data didn't include extension
        // todo: what to do if file.targetExtension is empty?
        const targetPathTransform = config.targetPathTransformation[file.sourceSecondExtension + file.targetExtension];

        // todo: use only if targetPath wasn't set using template data
        if (targetPathTransform) {
            const targetPathRelativeTransformed = targetPathTransform(file.targetPathRelative);
            if (typeof targetPathRelativeTransformed != "string") {
                throw new Error(
                    `The targetPath returned by targetPathTransform for ${file.sourceSecondExtension} -> ${file.targetExtension} must be a string.`
                );
            }
            if (targetPathRelativeTransformed.trim() == "") {
                throw new Error(
                    `The targetPath returned by targetPathTransform for ${file.sourceSecondExtension} -> ${file.targetExtension} must be a non-empty non-whitespace-only string.`
                );
            }
            const path = pathParse(targetPathRelativeTransformed);
            if (path.dir.split(pathSeparator).includes("..")) {
                throw new Error(
                    `The targetPath returned by targetPathTransform for ${file.sourceSecondExtension} -> ${file.targetExtension} must not contain ".." path segments.`
                );
            }

            file.targetPathRelative = targetPathRelativeTransformed;
        }

        log.debug(`Final file: ${JSON.stringify(file)}`);

        // may be undefined if none were added
        const transformations = config.transformations[file.sourceSecondExtension + file.targetExtension];

        // if undefined, defaults to renderedContent
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

        // todo: log writing...
        if (!flags.dryrun) {
            // don't await, runs concurrently
            writeFile(file.targetPath, file.targetDirectory, transformedContent);
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = files.templates.length + files.assets.length;
    console.log(
        `Successfully built ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${
            amount == 1 ? "file" : "files"
        } in ${duration}s.`
    );

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

/**
 * Splits path into its constituents
 * path = dir + name + ext
 *      = root + dirRel + name + ext
 * @param path path to split
 * @returns object with root, dirRel, name and ext properties
 */
function splitPath(path: string): { root: string; dirRel: string; name: string; ext: string } {
    const { root, dir, name, ext } = pathParse(path);
    return { root: root, dirRel: pathRelative(root, dir), name: name, ext: ext };
}

/**
 * Builds file object. Setting any property updates all others.
 * targetPath is initialised to same relative path in target as sourcePath is in source
 * source/targetPath/Directory are stripped of leading root segment
 * TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
 * TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
 * @param source path of source directory
 * @param target path of target directory
 * @param sourcePath path of file
 */
// todo: relax constraint of return type
// todo: check when uses sourcePath/Directory without subtracting root first, e.g. in computation of sourcePath/DirectoryRelative...
function makeFileObject(source: string, target: string, sourcePath: string): Readonly<FileObject> {
    // dir_*, name_*, ext_* hold data, will be used by getter and setters

    let { dirRel: dirRel_s, name: name_s, ext: ext_s } = splitPath(sourcePath);

    let dirRel_t = pathJoin(target, pathRelative(source, dirRel_s));
    let name_t = name_s;
    let ext_t = ext_s;

    return {
        // ------ source path -------

        get sourcePath() {
            return pathJoin(dirRel_s, name_s + ext_s);
        },

        set sourcePath(val) {
            const { dirRel: _dirRel, name: _name, ext: _ext } = splitPath(val);
            dirRel_s = _dirRel;
            name_s = _name;
            ext_s = _ext;
        },

        get sourcePathRelative() {
            return pathRelative(source, this.sourcePath);
        },

        set sourcePathRelative(val) {
            this.sourcePath = pathJoin(source, val);
        },

        get sourceDirectory() {
            return dirRel_s;
        },

        set sourceDirectory(val) {
            const { dirRel: _dirRel } = splitPath(val);
            dirRel_s = _dirRel;
        },

        get sourceDirectoryRelative() {
            return pathRelative(source, this.sourceDirectory);
        },

        set sourceDirectoryRelative(val) {
            this.sourceDirectory = pathJoin(source, val);
        },

        get sourceBase() {
            return name_s + ext_s;
        },

        set sourceBase(val) {
            const { name: _name, ext: _ext } = pathParse(val);
            name_s = _name;
            ext_s = _ext;
        },

        get sourceName() {
            return name_s;
        },

        set sourceName(val) {
            name_s = val;
        },

        get sourceExtension() {
            return ext_s;
        },

        set sourceExtension(val) {
            ext_s = val;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get sourceDirectoryRelativeFirstSegment() {
            const [first, ...restArr] = this.sourceDirectoryRelative.split(pathSeparator);
            return first;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get sourceDirectoryRelativeRestSegment() {
            const [first, ...restArr] = this.sourceDirectoryRelative.split(pathSeparator);
            return restArr;
        },

        get sourceExtensionSecond() {
            // because name ends on second extension if ext is first extension
            // note: pathExtname returns empty string if single "." is first character, i.e. a nameless files like ".css.js" or ". .js" or "..js" are handled as asset
            // is empty string if doesn't find anything
            return pathExtname(this.sourceName);
        },

        // ------ target path -------

        get targetPath() {
            return pathJoin(dirRel_t, name_t + ext_t);
        },

        set targetPath(val) {
            const { dirRel: _dirRel, name: _name, ext: _ext } = splitPath(val);
            dirRel_t = _dirRel;
            name_t = _name;
            ext_t = _ext;
        },

        get targetPathRelative() {
            return pathRelative(target, this.targetPath);
        },

        set targetPathRelative(val) {
            this.targetPath = pathJoin(target, val);
        },

        get targetDirectory() {
            return dirRel_t;
        },

        set targetDirectory(val) {
            const { dirRel: _dirRel } = splitPath(val);
            dirRel_t = _dirRel;
        },

        get targetDirectoryRelative() {
            return pathRelative(target, this.targetDirectory);
        },

        set targetDirectoryRelative(val) {
            this.targetDirectory = pathJoin(target, val);
        },

        get targetBase() {
            return name_t + ext_t;
        },

        set targetBase(val) {
            const { name: _name, ext: _ext } = pathParse(val);
            name_t = _name;
            ext_t = _ext;
        },

        get targetName() {
            return name_t;
        },

        set targetName(val) {
            name_t = val;
        },

        get targetExtension() {
            return ext_t;
        },

        set targetExtension(val) {
            ext_t = val;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get targetDirectoryRelativeFirstSegment() {
            const [first, ...restArr] = this.targetDirectoryRelative.split(pathSeparator);
            return first;
        },

        // only used for files in top-level data or layout directory
        // TODO: Make sure source and target don't start with pathSeparator, otherwise xDirectory/PathRelative will be absolute, and break xPath/DirectoryRelative*Segment()
        // TODO: Make sure xPath/DirectoryRelative isn't set with an absolute path, otherwise if source and target are empty, this will break xPath/DirectoryRelative*Segment()
        get targetDirectoryRelativeRestSegment() {
            const [first, ...restArr] = this.targetDirectoryRelative.split(pathSeparator);
            return restArr;
        }
    };
}

type FileObject = {
    sourcePath: string;
    sourcePathRelative: string;
    sourceDirectory: string;
    sourceDirectoryRelative: string;
    sourceBase: string;
    sourceName: string;
    sourceExtension: string;
    sourceExtensionSecond: string;
    sourceDirectoryRelativeFirstSegment: string;
    sourceDirectoryRelativeRestSegment: string[];
    targetPath: string;
    targetPathRelative: string;
    targetDirectory: string;
    targetDirectoryRelative: string;
    targetBase: string;
    targetName: string;
    targetExtension: string;
    targetDirectoryRelativeFirstSegment: string;
    targetDirectoryRelativeRestSegment: string[];
};

type FileList = {
    assets: FileObject[];
    templates: FileObject[];
    layouts: FileObject[];
    globals: FileObject[];
    ignored: FileObject[];
};
