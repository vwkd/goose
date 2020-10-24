import { log } from "./logger.ts";

import { copy, write } from "./build/write.ts";
import { loadFileList } from "./build/read.ts";
import { loadGlobal, loadLayout, loadTemplate } from "./build/import.ts";
import { mergeDataGlobal, mergeDataLayout, mergeDataTemplate } from "./build/data.ts";
import { renderTemplate } from "./build/render.ts";
import { transformTemplate, transformTargetPathTemplate } from "./build/transform.ts";

import { exists } from "./deps.ts";

import type { BaseFile, Config, Flags } from "./types.ts";

export async function build(config: Config, flags: Flags) {
    log.info("Build started.");
    log.debug(`Build options: ${JSON.stringify(config)}`);
    log.debug(`Build flags: ${JSON.stringify(flags)}`);

    const startTime = performance.now();

    log.trace(`------ Preparations ------`);

    log.trace(`Checking directories...`);

    const sourceFolderExists = await exists(config.source);

    if (!sourceFolderExists) {
        throw new Error(`Source folder ${config.source} doesn't exist.`);
    }

    if (!flags.dryrun) {
        const targetFolderExists = await exists(config.target);

        // beware: in meantime during build user could create target folder, overwrites because no second check before writing
        if (/* !config.incrementalBuild && */ targetFolderExists) {
            throw new Error(
                `Target folder ${config.target} already exists. Please delete or use incremental build instead.`
            );
        } else if (/* config.incrementalBuild && */ !targetFolderExists) {
            console.warn(
                `Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`
            );
            log.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`);
        }
    }

    log.trace(`Loading file list...`);

    const { assets, globals, layouts, templates, ignored } = await loadFileList({
        source: config.source,
        target: config.target,
        ignoredFilename: config.ignoredFilename,
        ignoredDirname: config.ignoredDirname,
        layoutDirname: config.layoutDirname,
        dataDirname: config.dataDirname
    });

    if (!flags.dryrun) {
        log.trace(`Copying assets...`);
    }

    // await at very end of build since not needed in meantime
    const assetsRefsPromises = flags.dryrun ? [] : assets.map(copy);

    log.trace(`------ Processing globals ------`);

    // should be in same order as in globals since doesn't await return of loadGlobal()
    const globalsFullPromises = globals.map(loadGlobal);

    // todo: await later when needs
    const globalsFull = await Promise.all(globalsFullPromises);

    const globalData = mergeDataGlobal(globalsFull, config.mergeFunction);

    log.trace(`------ Processing layouts ------`);

    // should be in same order as in layouts since doesn't await return of loadLayout()
    const layoutsFullPromises = layouts.map(loadLayout);
    // todo: await later when needs
    const layoutsFull = await Promise.all(layoutsFullPromises);

    // todo: merge with global data
    const layoutsFullMerged = layoutsFull.map((lay, _, arr) =>
        mergeDataLayout(lay, arr, config.mergeFunction, globalData)
    );

    log.trace(`------ Processing templates ------`);

    // process and write all in single pass, this way can parallelise since templates are independent
    // instead of a for..of loop which wouldn't parallelise
    // todo: can't check that targetPaths are distinct, would need to pre-process parallel until data merge, then await each for mutual validation, then continue parallel...
    // returns new file object with additional template-specific properties
    // doesn't use return value, only for awaiting promise
    async function processTemplate(file: BaseFile): Promise<void> {
        const templatePromise = loadTemplate(file);
        // todo: await later when needs
        const templateNEW = await templatePromise;

        await transformTargetPathTemplate(templateNEW, config.targetPathTransformation);

        const mergedData = mergeDataTemplate(templateNEW, layoutsFullMerged, config.mergeFunction, globalData);

        // todo: transform target path, but only if wasn't set via config export
        // needs way to know... compare targetPath of original template file to targetPath of new template file

        const renderedString = await renderTemplate(templateNEW, layoutsFullMerged, mergedData);

        const transformedString = await transformTemplate(templateNEW, renderedString, config.transformations);

        return flags.dryrun ? undefined : write(file, transformedString);
    }

    // should be in same order as in templates since doesn't await return of loadTemplate()
    const templatesPromises = templates.map(processTemplate);
    // todo: await later when needs, return type is undefined, just for promises
    const templatesNEW = await Promise.all(templatesPromises);

    // await running copies
    await Promise.all(assetsRefsPromises);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = templates.length + assets.length;
    console.log(
        `Successfully built ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${
            amount == 1 ? "file" : "files"
        } in ${duration}s.`
    );

    log.info("Build finished.");
}
