// quick primer on paths: can contain almost all characters, even spaces, just treats it as a valid path

import { log } from "./logger.ts";
import type { options } from "./types.ts";
import {
    exists,
    ensureDir,
    walk,
    copy,
    parse as pathParse,
    sep as pathSeparator,
    join as pathJoin,
    createHash,
    shallowMerge,
    deepMerge,
    walkChainIdCall,
    walkChainIdMerge
} from "./deps.ts";

// todo: respect verbose and quiet options

/**
 * Heart of application.
 * Builds files from options.
 * @param options options to build
 */
export async function build(options: options) {
    // todo: tmp, import from .goose.js
    options.ignoredFilename = "_";
    options.ignoredDirname = "_";
    options.layoutDirectory = "_layouts";
    options.dataDirectory = "_data";
    options.incrementalBuild = false;
    // todo: clean options, e.g. strip `.` and `/` infront of folders, otherwise startsWith won't match in build()...
    // todo: validate properties, best in bulk wherever they're loaded in
    options.transformations = {
        ".html": [],
        ".css": [str => str + "hi"],
    };

    log.info("Build started.");
    log.debug(`Build options: ${JSON.stringify(options)}`);

    const startTime = performance.now();

    // ------ validate directories ------
    const sourceFolderExists = await exists(options.input);

    if (!sourceFolderExists) {
        throw new Error(`Source folder ${options.input} doesn't exist.`);
    }

    const targetFolderExists = await exists(options.output);

    // beware: in meantime user could create output folder, overwrites because no second check before writing
    if (!options.incrementalBuild && targetFolderExists) {
        throw new Error(`Target folder ${options.output} already exists.`);
    } else if (options.incrementalBuild && !targetFolderExists) {
        console.warn(`Target folder ${options.output} doesn't exist. Will do a full build instead.`);
    }

    // ------ load files ------
    // templates are rendered, assets are copied, rest is ignored
    const files = { templates: [], assets: [], ignored: [], layouts: [], globaldata: [] };

    const dataDirectory = pathJoin(options.input, options.dataDirectory);
    const layoutDirectory = pathJoin(options.input, options.layoutDirectory);

    try {
        for await (const item of walk(options.input, { includeDirs: false })) {
            const { dir, ext, name, base } = pathParse(item.path);

            const [_a, ...inputPathRelativeArr] = item.path.split(pathSeparator);
            const [_b, ...inputDirectoryRelativeArr] = dir.split(pathSeparator);

            const file = {
                inputPath: item.path,
                inputPathRelative: inputPathRelativeArr.join(pathSeparator),
                inputDirectory: dir,
                inputDirectoryRelative: inputDirectoryRelativeArr.join(pathSeparator),
                inputExtension: ext,
                inputName: name,
                inputBase: base
            };

            if (name.startsWith(options.ignoredFilename)) {
                log.trace(`File is ignored because of filename: ${item.path}`);
                files.ignored.push(file);
            } else if (dir.startsWith(dataDirectory)) {
                log.trace(`File is global data because of directory: ${item.path}`);
                files.globaldata.push(file);
            } else if (dir.startsWith(layoutDirectory)) {
                log.trace(`File is layout because of directory: ${item.path}`);
                const [_c, ...inputPathRelativeToLayoutArr] = inputPathRelativeArr;
                file.inputPathRelativeToLayout = inputPathRelativeToLayoutArr.join(pathSeparator);
                files.layouts.push(file);
            }

            // after check for dataDirectory and layoutDirectory such that they can use ignoredFilename
            else if (dir.split(pathSeparator).some(str => str.startsWith(options.ignoredDirname))) {
                log.trace(`File is ignored because of directory name: ${item.path}`);
                files.ignored.push(file);
            } else if (ext == ".js") {
                log.trace(`File is template because of extension: ${item.path}`);
                // outputPath/Directory because is outputted, can change later due to local properties
                file.outputPath = pathJoin(options.output, file.inputPathRelative);
                file.outputDirectory = pathJoin(options.output, file.inputDirectoryRelative);
                files.templates.push(file);
            } else {
                log.trace(`File is asset because everything else: ${item.path}`);
                // outputPath/Directory because is outputted, won't change later
                file.outputPath = pathJoin(options.output, file.inputPathRelative);
                file.outputDirectory = pathJoin(options.output, file.inputDirectoryRelative);
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
    if (!options.dryrun) {
        copyFiles(files.assets);
    }

    // ------ load global data ------
    const globalData = [];

    // todo: make robust, how does import function, what does do with complex values...
    for (const file of files.globaldata) {
        const relPath = "." + pathJoin(pathSeparator, file.inputPath);
        const o = await import(relPath);
        globalData.push(...Object.values(o));
    }

    // ------ load layouts ------
    // loads all layouts into memory, assumes there are not many

    // todo: make robust, don't save content in memory as object property, instead for each file compute everything and write out immediately
    for (const file of files.layouts) {
        log.debug(`--- Process layout ${file.inputPath} ---`);
        // todo: make robust, how does import function, what does do with complex values...
        const relPath = "." + pathJoin(pathSeparator, file.inputPath);
        let layout = undefined;
        try {
            layout = await import(relPath);
        } catch (e) {
            throw new Error(`Layout ${file.inputPath} couldn't be imported. ${e.message}`);
        }

        // todo: validation, render returns string, data deep merges well with all kinds of data objects (string, bigint, regexp, ...)
        if (!layout.render) {
            throw new Error(`Layout ${file.inputPath} doen't export a render function.`);
        }
        if (typeof layout.render != "function") {
            throw new Error(`Layout ${file.inputPath} render function must be a function.`);
        }
        file.render = layout.render;

        // todo: validation, data can be anything...
        if (!layout.data) {
            log.warn(`Layout ${file.inputPath} doen't export a data object.`);
        }
        if (typeof layout.data == "function") {
            throw new Error(`Layout ${file.inputPath} data object must not be a function.`);
        }
        // if data is non-object, empty object, or doesn't have layout property, is simply undefined
        const { layout: layoutPathRelative, ...data } = layout.data;
        // todo: validate layout: string, single path, no ../ anywhere, etc.
        file.layoutPathRelative = layoutPathRelative;
        file.data = data;
        log.debug(`Layout frontmatter: ${JSON.stringify(file.data)}`);
    }

    // ------ process templates ------
    // process and write all in single pass
    for (const file of files.templates) {
        log.debug(`--- Process template ${file.inputPath} ---`);

        // ---------- load template ----------

        // todo: make robust, how does import function, what does do with complex values...
        const relPath = "." + pathJoin(pathSeparator, file.inputPath);
        let template = undefined;
        try {
            template = await import(relPath);
        } catch (e) {
            throw new Error(`Template ${file.inputPath} couldn't be imported. ${e.message}`);
        }

        // todo: validation, render returns string, data deep merges well with all kinds of data objects (string, bigint, regexp, ...)
        if (!template.render) {
            throw new Error(`Template ${file.inputPath} doen't export a render function.`);
        }
        if (typeof template.render != "function") {
            throw new Error(`Template ${file.inputPath} render function must be a function.`);
        }
        file.render = template.render;

        // todo: validation, data can be anything...
        if (!template.data) {
            log.warn(`Template ${file.inputPath} doen't export a data object.`);
        }
        if (typeof template.data == "function") {
            throw new Error(`Template ${file.inputPath} data object must not be a function.`);
        }
        // if data is non-object, empty object, or doesn't have layout property, is simply undefined
        const { layout: layoutPathRelative, permalink, ...data } = template.data;

        file.data = data;
        log.debug(`Template frontmatter: ${JSON.stringify(file.data)}`);

        // validate layout path
        if (layoutPathRelative) {
            if (typeof layoutPathRelative != "string") {
                throw new Error(`Layout path in template ${file.inputPath} must be a string.`);
            }
            const layoutPathRelativeArr = layoutPathRelative.split(pathSeparator);
            if (layoutPathRelativeArr.includes("..")) {
                throw new Error(`Layout path ${layoutPathRelative} in template ${file.inputPath} can't contain "..".`);
            }
        }
        file.layoutPathRelative = layoutPathRelative;

        // validate permalink
        if (permalink) {
            if (typeof permalink != "string") {
                throw new Error(`Permalink in template ${file.inputPath} must be a string.`);
            }
            const outputPathRelativeArr = permalink.split(pathSeparator);
            if (outputPathRelativeArr.includes("..")) {
                throw new Error(`Permalink ${permalink} in template ${file.inputPath} can't contain "..".`);
            }
        }
        file.outputPathRelative = permalink || file.inputPathRelative;
        file.outputPath = pathJoin(options.output, file.outputPathRelative);
        const { dir, ext, name, base } = pathParse(file.outputPathRelative);
        file.outputDirectoryRelative = dir;
        file.outputDirectory = pathJoin(options.output, file.outputDirectoryRelative);
        file.outputExtension = ext;
        file.outputName = name;
        file.outputBase = base;

        log.debug(`File: ${JSON.stringify(file)}`);

        // ---------- compute data properties ----------

        // todo: merge in global data, allow for shallowMerge
        // todo: build mergedData for templates in advance, doesn't need to compute same for every template...
        const mergedData = walkChainIdMerge({
            startNode: file,
            nodeList: files.layouts,
            linkName: "layoutPathRelative",
            idName: "inputPathRelativeToLayout",
            mergeProperty: "data",
            mergeFunction: deepMerge
        });
        log.debug(`Merged data: ${JSON.stringify(mergedData)}`);

        // ---------- render ----------

        function tryRender(node, lastValue, data) {
            let str = undefined;
            try {
                str = node.render(data, lastValue);
            } catch (e) {
                throw new Error(`Template ${node.inputPath} render function threw an error. ${e.message}`);
            }
            if (typeof str != "string") {
                throw new Error(`Template ${node.inputPath} render function must return a string.`);
            }
            return str;
        }

        const renderedContent = walkChainIdCall({
            startNode: file,
            nodeList: files.layouts,
            linkName: "layoutPathRelative",
            idName: "inputPathRelativeToLayout",
            callback: tryRender,
            data: mergedData
        });

        log.debug(`Rendered content: ${JSON.stringify(renderedContent)}`);

        // ---------- transform ----------

        // todo: validate transformations, functions take string and return string, etc. like for templates
        const transformations = options.transformations[file.outputExtension];

        // if transformations is empty, returns initial value renderedContent
        const transformedContent = transformations.reduce((acc, transform) => {
                const str = transform(acc);
                if (typeof str != "string") {
                    throw new Error(`The transformation "${transform.name || "(anonymous)"}" must return a string.`);
                }
                return str;
            }, renderedContent);

        log.debug(`Transformed content: ${JSON.stringify(transformedContent)}`);

        // ---------- write out ----------

        if (!options.dryrun) {
            // don't await, runs concurrently
            writeFile(file.outputPath, file.outputDirectory, transformedContent);
        }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = files.templates.length + files.assets.length;
    console.log(`Successfully build ${amount} ${amount == 1 ? "file" : files} in ${duration}s.`);

    log.info("Build ended.");
}

// todo: this only writes, not copies
async function copyFiles(files) {
    for (const file of files) {
        log.debug(`Copying: ${file.outputPath}...`);
        await ensureDir(file.outputDirectory);
        await copy(file.inputPath, file.outputPath);
    }
}

async function writeFile(path, directory, content) {
    log.debug(`Writing: ${path}...`);
    await ensureDir(directory);
    await Deno.writeTextFile(path, content);
}

// todo: use inline because can customise error paths
function validatePath(str) {
    if (typeof str != "string") {
        throw new Error(`Path must be a string.`);
    }
    const segments = str.split(pathSeparator);
    if (segments.includes("..")) {
        throw new Error(`Path ${permalink} can't contain "..".`);
    }
}
