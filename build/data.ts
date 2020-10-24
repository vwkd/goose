import { log } from "../logger.ts";
import type { Global, Layout, Template, MergeFunction, Data } from "../types.ts";
import { walkChainIdMerge } from "../deps.ts";

// takes all files and returns single merged data
// merge data across all globals
export function mergeDataGlobal(files: Global[], mergeFunction: MergeFunction): Data {
    log.trace(`Merging data`);

    const filesWithData = files.filter(el => el.data !== undefined).map(el => el.data);

    // don't use data if undefined
    return mergeFunction({}, ...filesWithData);
}

// takes single file and returns merged data along chain
// todo: filter out undefined
// todo: check that goes well if any layout of another layout doesn't exist
// desc: until first layout that doesn't exist or doesn't export data
export function mergeDataLayout(file: Layout, layouts: Layout[], mergeFunction: MergeFunction, globalData: Data): Layout {
    log.trace(`Merging data`);

    // merge data across layout chain, needs all layouts ready
    // loops until first layout without a data function
    // todo: what happens if template itself doesn't have one?
    const mergedData = walkChainIdMerge({
        startNode: file,
        nodeList: layouts,
        linkName: "layoutPathRelative",
        idName: "sourcePathRelativeRestSegment",
        mergeProperty: "data",
        mergeFunction: mergeFunction
    });

    // merge in global data, saves computations when multiple templates use same layout
    // don't use mergeData data if undefined
    // if globalData is undefined, get's merged away
    // return mergedData === undefined ? globalData : mergeFunction(globalData, mergedData);
    if (mergedData === undefined) {
        return {...file, dataMerged: globalData}
    } else {
        return {...file, dataMerged: mergeFunction(globalData, mergedData)}
    }
}

// todo: check that goes well if layout of template doesn't exist
// desc: merges data of template over its layout chain
// desc: until first layout that doesn't exist or doesn't export data
// just uses already merged data of layout and global data in case if layout doesn't exist
export function mergeDataTemplate(
    file: Template,
    layouts: Layout[],
    mergeFunction: MergeFunction,
    globalData: Data
): Data {
    log.trace(`Merging data`);

    if (file.layoutPathRelative) {
        // if exists is unique because files on file system are unique
        const layout = layouts.find(lay => {
            return file.layoutPathRelative == lay.sourcePathRelativeRestSegment;
        });

        // layout does exists, use its merged data
        if (layout) {
            // global data was merged with layout data already
            // don't use local data if undefined
            return file.data === undefined ? layout.dataMerged : mergeFunction(layout.dataMerged, file.data);
        }

        // layout doesn't exist, merge local data with global data
        else {
            console.warn(
                `Couldn't find layout ${file.layoutPathRelative} for template ${file.sourcePath}. Will ignore the chain.`
            );
            // don't use local data if undefined
            return file.data === undefined ? globalData : mergeFunction(globalData, file.data);
        }
    }

    // has no layout, merge local data with global data
    else {
        // don't use local data if undefined
        return file.data === undefined ? globalData : mergeFunction(globalData, file.data);
    }
}
