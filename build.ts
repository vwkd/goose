// todo: improve debug logging messages
// todo: improve user logging messages, respect quiet option, maybe also verbose (or should just use debug log? But one is user facing one is developer facing...)
// todo: add helper notice to user at beginning of error statements to notice where it broke, sequence doesn't help because parallelisation mixes order, maybe also module name because bubble up

import { exists } from "./deps.ts";

import { log } from "./logger.ts";
import { copy, write } from "./build/write.ts";
import { loadFileList } from "./build/read.ts";
import { loadGlobal, loadLayout, loadTemplate } from "./build/import.ts";
import { mergeDataGlobal, mergeDataLayout, mergeDataTemplate } from "./build/data.ts";
import { renderTemplate } from "./build/render.ts";
import { transformTemplate, transformTargetPathTemplate } from "./build/transform.ts";

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

    // beware: in meantime during build user could create target folder, overwrites because no second check before writing
    const targetFolderExists = await exists(config.target);

    if (/* !config.incrementalBuild && */ targetFolderExists && !flags.dryrun) {
        // throw new Error(
        //     `Target folder ${config.target} already exists. Please delete first or use incremental build instead.`
        // );
        throw new Error(`Target folder ${config.target} already exists. Please delete first.`);
    } else if (/* config.incrementalBuild && */ !targetFolderExists && !flags.dryrun) {
        // console.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`);
        // log.warn(`Target folder ${config.target} doesn't exist. Will do a full build instead of an incremental.`);
    }

    log.trace(`Loading file list...`);

    const { assetsBase, globalsBase, layoutsBase, templatesBase, ignoredBase } = await loadFileList({
        source: config.source,
        target: config.target,
        ignoredFilename: config.ignoredFilename,
        ignoredDirname: config.ignoredDirname,
        layoutDirname: config.layoutDirname,
        dataDirname: config.dataDirname
    });

    log.trace(`Copying assets...`);

    // start copy as early as possible to parallelise with rest of build
    // await only at very end before returns
    const assetsRefsPromises = flags.dryrun ? [] : assetsBase.map(copy);

    log.trace(`------ Processing globals ------`);

    // should be in same order as in globals since doesn't await return of loadGlobal()
    const globalsPromises = globalsBase.map(loadGlobal);

    // todo: await later when needs
    const globals = await Promise.all(globalsPromises);

    const globalData = mergeDataGlobal(globals, config.mergeFunction);

    log.trace(`------ Processing layouts ------`);

    // should be in same order as in layouts since doesn't await return of loadLayout()
    const layoutsPromises = layoutsBase.map(loadLayout);
    // todo: await later when needs
    const layouts = await Promise.all(layoutsPromises);

    const layoutsDataMerged = layouts.map((lay, _, arr) =>
        mergeDataLayout(lay, arr, config.mergeFunction, globalData)
    );

    log.trace(`------ Processing templates ------`);

    // todo: consider switching to sequential again, because in parallel can't check that targetPaths are distinct
    // would need to split and process parallel only after loadTemplate()

    /**
     * Takes a base template file, processes it, and writes out file
     * Instead of sequential for..of loop because can parallelise using map() and Promise.all()
     * Requires layoutsDataMerged and globalData to be ready
     * @param file template file
     * @returns undefined as promise, just use return value to await promise
     */
    async function processTemplate(file: BaseFile): Promise<void> {
        const templatePromise = loadTemplate(file);
        // todo: await later when needs
        const template = await templatePromise;

        // todo: don't transform target path if it was also set via config function
        // needs to keep state somehow, or compare targetPath to sourcePath
        await transformTargetPathTemplate(template, config.targetPathTransformation[template.sourceExtensionSecond + template.targetExtension]);

        const mergedData = mergeDataTemplate(template, layoutsDataMerged, config.mergeFunction, globalData);

        const renderedString = await renderTemplate(template, layoutsDataMerged, mergedData);

        // todo: what to do if file.targetExtension is empty? if provided custom targetPath, e.g. via config or transformTargetPath
        const transformedString = await transformTemplate(renderedString, config.transformations[template.sourceExtensionSecond + template.targetExtension]);

        return flags.dryrun ? undefined : write(file, transformedString);
    }

    // runs in parallel, instead of sequential for..of loop
    const templatesRefPromises = templatesBase.map(processTemplate);
    await Promise.all(templatesRefPromises);

    // await running copies
    await Promise.all(assetsRefsPromises);

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const amount = templatesBase.length + assetsBase.length;
    console.log(
        `Successfully built ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${
            amount == 1 ? "file" : "files"
        } in ${duration}s.`
    );

    log.info("Build finished.");
}
