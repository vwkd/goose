import { log } from "./logger.ts";
import type { options } from "./types.ts";
import {
    exists,
    ensureDir,
    walk,
    walkSync,
    parse as pathParse,
    sep as pathSeparator,
    join as pathJoin,
    createHash,
    Marked,
    yamlParse,
    shallowMerge,
    deepMerge
} from "./deps.ts";
import { parse as frontmatterParse } from "./frontmatter.ts";

// todo: respect verbose and quiet options

/**
 * Heart of application.
 * Builds files from options.
 * @param options options to build
 */
export async function build(options: options) {
    // todo: tmp
    options.ignoredFilename = "_";
    options.ignoredDirname = "_";
    options.layoutDirectory = "_layouts";
    options.dataDirectory = "_data";
    options.renderedFiletypes = [".md", ".html"];
    options.incrementalBuild = false;
    options.frontmatterParser = yamlParse;
    options.frontmatterDelimiter = "---";
    // todo: clean options, e.g. strip `.` and `/` infront of folders, otherwise startsWith won't match in build()...
    // todo: validate properties, e.g. frontmatterParser, frontmatterDelimiter, etc.

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
            } else if (options.renderedFiletypes.includes(ext)) {
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

    // ------ save assets ------
    // don't await, because should run concurrently
    write(files.assets, options.dryrun);

    // ------ load global data ------
    const globalData = [];

    // todo: make robust, how does import function, what does do with complex values...
    for (const file of files.globaldata) {
        const relPath = "." + pathJoin(pathSeparator, file.inputPath);
        const o = await import(relPath);
        globalData.push(...Object.values(o));
    }

    // ------ load local data ------

    const frontmatterOptions = {
        parser: options.frontmatterParser,
        delimiter: options.frontmatterDelimiter
    };

    // todo: make robust, don't save content in memory as object property, instead for each file compute everything and write out immediately
    for (const file of files.layouts) {
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
        file.layoutPathRelative = layoutPathRelative;
        file.data = data;
        log.debug(`Layout frontmatter: ${JSON.stringify(file.data)}`);
    }

/*     for (const file of files.templates) {
        const content = await Deno.readTextFile(file.inputPath);
        log.debug(`File content: ${JSON.stringify(content)}`);

        const frontmatter = frontmatterParse(content, frontmatterOptions);
        log.debug(`Template frontmatter: ${JSON.stringify(frontmatter)}`);
        const { layout: layoutPathRelative, permalink, ...data } = frontmatter.data;
        // todo: validate layout: string, single path, no ../ anywhere, etc.
        file.layoutPathRelative = layoutPathRelative;
        // todo: validate permalink, e.g. no ../ anywhere, etc.
        file.outputPathRelative = permalink || file.inputPathRelative;
        file.outputPath = pathJoin(options.output, file.outputPathRelative);
        file.outputDirectory = pathParse(file.outputPath).dir;
        file.data = data;

        const markup = Marked.parse(frontmatter.content);
        log.debug(`Template markup: ${JSON.stringify(markup)}`);
        file.content = markup.content; */
    }

    // ------ parse markdown ------
    // todo: change markdown to simple output transformation.

    // todo: how to use variables in markdown ???

    // ------ parse templates ------
    // todo:
    for (const file of files.templates) {
        // todo: validate no circular imports
        console.log("TMPL", file);

        // todo: build merged data
        // todo: merge global data, allow for shallowMerge
        const data = deepMerge(layout.data, file.data);

        const res = renderRecursively(file, file.content, file.data, []);
/*         if (file.layoutPathRelative) {
            // path of layout is guaranteed to be unique because files in file system are unique
            const layout = files.layouts.find(lay => lay.inputPathRelativeToLayout == file.layoutPathRelative);

            const str = layout.render(file.content, data);

            if (layout.layoutPathRelative) {
                // ... recursive
            }
        } */


    }

    // todo: walk once already to build merged data, such that it's available and same for every file in chain

    function renderRecursively(template, renderedString: string, mergedData, usedLayouts: string[]): string {
        log.trace(`Used layouts: ${usedLayouts}`);

        // path is circular
        if (usedLayouts.includes(template.layoutPathRelative)) {
            console.warn(
                `Layout ${template.inputPathRelative} has a circular dependency on ${template.layoutPathRelative}. Won't compute further layouts.`
            );
            return renderedString;
        }

        // template has layout
        if (template.layoutPathRelative) {
            // try to find layout, guaranteed to be unique because path is unique
            const layout = files.layouts.find(el => el.inputPathRelativeToLayout == template.layoutPathRelative);

            // path was invalid
            if (!layout) {
                console.warn(
                    `Layout ${template.layoutPathRelative} for ${template.inputPathRelative} couldn't be found. Won't compute further layouts.`
                );
                return renderedString;
            }

            // render layout
            else {
                let str = undefined;
                try {
                    str = layout.render(renderedString, mergedData);
                } catch (e) {
                    throw new Error(`Layout ${layout.inputPath} render function threw an error. ${e.message}`);
                }
                if (typeof str != "string") {
                    throw new Error(`Layout ${layout.inputPath} render function must return a string.`);
                }

                // log.trace(`Rendered string: ${str}`);
                return renderRecursively(layout, str, mergedData, [...usedLayouts, template.layoutPathRelative]);
            }
        }

        // template has no layout
        else {
            // log.trace(`Nothing more to render: ${renderedString}`);
            return renderedString;
        }
    }

    // ------ save templates ------
    // overwrites any files in the directory

    write(files.templates, options.dryrun);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = files.templates.length + files.assets.length;
    console.log(`Successfully build ${amount} ${amount == 1 ? "file" : files} in ${duration}s.`);

    log.info("Build ended.");
}

async function write(files, dryrun) {
    if (dryrun) {
        return;
    }
    for (const file of files) {
        log.debug(`Writing: ${file.outputPath}...`);
        await ensureDir(file.outputDirectory);
        await Deno.writeTextFile(file.outputPath, file.content);
    }
}
