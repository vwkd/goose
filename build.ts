// quick primer on paths: can contain almost all characters, even spaces, just treats it as a valid path

// todo: add module name at beginning of error & log statements, because bubble up

// todo: implement incremental build

// todo: allow for shallowMerge

import { log } from "./logger.ts";
import {
    exists,
    ensureDir,
    walk,
    copy,
    parse as pathParse,
    sep as pathSeparator,
    join as pathJoin,
    extname as pathExtname,
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
    const sourceFolderExists = await exists(config.sourceDirname);

    if (!sourceFolderExists) {
        throw new Error(`Source folder ${config.sourceDirname} doesn't exist.`);
    }

    if (!flags.dryrun) {
        const targetFolderExists = await exists(config.targetDirname);

        // beware: in meantime user could create target folder, overwrites because no second check before writing
        if (!config.incrementalBuild && targetFolderExists) {
            throw new Error(`Target folder ${config.targetDirname} already exists.`);
        } else if (config.incrementalBuild && !targetFolderExists) {
            console.warn(`Target folder ${config.targetDirname} doesn't exist. Will do a full build instead.`);
        }
    }

    // ------ load files ------
    // templates are rendered, assets are copied, rest is ignored
    const files = { templates: [], assets: [], ignored: [], layouts: [], globaldata: [] };

    const dataDirectory = pathJoin(config.sourceDirname, config.dataDirname);
    const layoutDirectory = pathJoin(config.sourceDirname, config.layoutDirname);

    try {
        for await (const item of walk(config.sourceDirname, { includeDirs: false })) {
            const { dir, ext, name, base } = pathParse(item.path);

            const [_a, ...sourcePathRelativeArr] = item.path.split(pathSeparator);
            const [_b, ...sourceDirectoryRelativeArr] = dir.split(pathSeparator);

            const file = {
                sourcePath: item.path,
                sourcePathRelative: sourcePathRelativeArr.join(pathSeparator),
                sourceDirectory: dir,
                sourceDirectoryRelative: sourceDirectoryRelativeArr.join(pathSeparator),
                sourceExtension: ext,
                sourceName: name,
                sourceBase: base
            };

            if (name.startsWith(config.ignoredFilename)) {
                log.trace(`File is ignored because of filename: ${item.path}`);
                files.ignored.push(file);
            } else if (dir.startsWith(dataDirectory)) {
                log.trace(`File is global data because of directory: ${item.path}`);
                files.globaldata.push(file);
            } else if (dir.startsWith(layoutDirectory)) {
                log.trace(`File is layout because of directory: ${item.path}`);
                const [_c, ...sourcePathRelativeToLayoutArr] = sourcePathRelativeArr;
                file.sourcePathRelativeToLayout = sourcePathRelativeToLayoutArr.join(pathSeparator);
                files.layouts.push(file);
            }

            // after check for dataDirectory and layoutDirectory such that they can use ignoredFilename
            else if (dir.split(pathSeparator).some(str => str.startsWith(config.ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                files.ignored.push(file);
            } else if (ext == ".js") {
                // because name ends on second extension
                // note: pathExtname returns empty string if single "." is first character, i.e. a nameless file like ".css.js" is handled as asset
                const secondExtension = pathExtname(name);
                if (secondExtension) {
                    log.trace(`File is template because of double "${secondExtension}.js" extension: ${item.path}`);
                    // outputted, but compute targetPath later when knows permalink from local properties
                    file.sourceExtension = secondExtension;
                    file.sourcePathRelativeWithoutJsExtension = pathJoin(file.sourceDirectoryRelative, name);
                    files.templates.push(file);
                } else {
                    log.trace(`File is asset because of single ".js" extension: ${item.path}`);
                    // outputted, compute targetPath now because won't change later
                    file.targetPath = pathJoin(config.targetDirname, file.sourcePathRelative);
                    file.targetDirectory = pathJoin(config.targetDirname, file.sourceDirectoryRelative);
                    files.assets.push(file);
                }
            } else {
                log.trace(`File is asset because everything else: ${item.path}`);
                // outputted, compute targetPath now because won't change later
                file.targetPath = pathJoin(config.targetDirname, file.sourcePathRelative);
                file.targetDirectory = pathJoin(config.targetDirname, file.sourceDirectoryRelative);
                files.assets.push(file);
            }
        }
    } catch (e) {
        // todo:
        console.log(e);
    }

    // ------ copy assets ------
    // start as early as possible to give time
    // don't await, runs concurrently
    if (!flags.dryrun) {
        copyFiles(files.assets);
    }

    // ------ load global data ------

    const globalDataArr = [];

    // no restrictions of imported value (or return type of function), will just get merged away if not a normal object
    // todo: make robust, what does do with complex values...
    for (const file of files.globaldata) {
        const relPath = "." + pathJoin(pathSeparator, file.sourcePath);

        let data = undefined;
        try {
            data = await import(relPath);
        } catch (e) {
            throw new Error(`Global data file ${file.sourcePath} couldn't be imported. ${e.message}`);
        }

        const defaultExport = data.default;
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

        // note: no validation on data, user has to deal with a useful/-less merge
        if (!layout.data) {
            log.warn(`Layout ${file.sourcePath} doen't have a named export 'data'.`);
        }
        // if (typeof layout.data == "function") {
        //     throw new Error(`Layout ${file.sourcePath} data object must not be a function.`);
        // }

        // todo: if layout.data is non-object, empty object, or doesn't have layout property, is simply undefined
        const { layout: layoutPathRelative, ...data } = layout.data;
        
        file.data = data;
        log.debug(`Layout frontmatter: ${JSON.stringify(file.data)}`);

        // validate layout path
        if (layoutPathRelative) {
            if (typeof layoutPathRelative != "string") {
                throw new Error(`Layout path in template ${file.sourcePath} must be a string.`);
            }
            const layoutPathRelativeArr = layoutPathRelative.split(pathSeparator);
            if (layoutPathRelativeArr.includes("..")) {
                throw new Error(`Layout path ${layoutPathRelative} in template ${file.sourcePath} can't contain "..".`);
            }
        }
        file.layoutPathRelative = layoutPathRelative;

        // ---------- compute data properties ----------
        // merge layout data up to global object now instead of with each template
        // saves computations when multiple template reuse the same layout

        const layoutData = walkChainIdMerge({
            startNode: file,
            nodeList: files.layouts,
            linkName: "layoutPathRelative",
            idName: "sourcePathRelativeToLayout",
            mergeProperty: "data",
            mergeFunction: config.mergeFunction
        });

        log.debug(`Merged data: ${JSON.stringify(layoutData)}`);

        const layoutAndGlobalData = config.mergeFunction(globalData, layoutData);

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
        const relPath = "." + pathJoin(pathSeparator, file.sourcePath);
        let template = undefined;
        try {
            template = await import(relPath);
        } catch (e) {
            throw new Error(`Template ${file.sourcePath} couldn't be imported. ${e.message}`);
        }

        // todo: validation, render returns string, data deep merges well with all kinds of data objects (string, bigint, regexp, ...)
        if (!template.render) {
            throw new Error(`Template ${file.sourcePath} doen't export a render function.`);
        }
        if (typeof template.render != "function") {
            throw new Error(`Template ${file.sourcePath} render function must be a function.`);
        }
        file.render = template.render;

        // note: no validation on data, user has to deal with a useful/-less merge
        if (!template.data) {
            log.warn(`Template ${file.sourcePath} doen't have a named export 'data'.`);
        }
        // if (typeof template.data == "function") {
        //     throw new Error(`Template ${file.sourcePath} data object must not be a function.`);
        // }

        // todo: if template.data is non-object, empty object, or doesn't have layout property, is simply undefined
        const { layout: layoutPathRelative, permalink, ...data } = template.data;

        file.data = data;
        log.debug(`Template frontmatter: ${JSON.stringify(file.data)}`);

        // validate layout path
        if (layoutPathRelative) {
            if (typeof layoutPathRelative != "string") {
                throw new Error(`Layout path in template ${file.sourcePath} must be a string.`);
            }
            const layoutPathRelativeArr = layoutPathRelative.split(pathSeparator);
            if (layoutPathRelativeArr.includes("..")) {
                throw new Error(`Layout path ${layoutPathRelative} in template ${file.sourcePath} can't contain "..".`);
            }
        }
        file.layoutPathRelative = layoutPathRelative;

        // validate permalink
        // todo: permalink must have extension ?!? use pathParse ?? permalink may not contain ..,
        // todo: use parsePath because makes platform independent, NO, will parse the string in that platform...
        if (permalink) {
            if (typeof permalink != "string") {
                throw new Error(`Permalink in template ${file.sourcePath} must be a string.`);
            }
            const targetPathRelativeArr = permalink.split(pathSeparator);
            if (targetPathRelativeArr.includes("..")) {
                throw new Error(`Permalink ${permalink} in template ${file.sourcePath} can't contain ".." path segments.`);
            }
        }
        file.targetPathRelative = permalink || file.sourcePathRelativeWithoutJsExtension;
        file.targetPath = pathJoin(config.targetDirname, file.targetPathRelative);
        const { dir, ext, name, base } = pathParse(file.targetPathRelative);
        file.targetDirectoryRelative = dir;
        file.targetDirectory = pathJoin(config.targetDirname, file.targetDirectoryRelative);
        file.targetExtension = ext;
        file.targetName = name;
        file.targetBase = base;

        log.debug(`File: ${JSON.stringify(file)}`);

        // ---------- compute data properties ----------

        // find layout of template
        const layout = files.layouts.find(lay => {
            return file.layoutPathRelative == lay.sourcePathRelativeToLayout;
        })

        // use precomputed merged data and merge with own
        const templateData = config.mergeFunction(file.data, layout.dataMerged);

        log.debug(`Merged template data: ${JSON.stringify(templateData)}`)

        // ---------- render ----------

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
    console.log(`Successfully build ${amount} ${amount == 1 ? "file" : "files"} in ${duration}s.`);

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