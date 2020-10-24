import { log } from "../logger.ts";
import type { Global, Layout, Template, MergeFunction, Data } from "../types.ts";
import { walkChainIdMerge } from "../deps.ts";

/**
 * Merges data property over all files using a merge function
 * If data property is undefined skips it
 * @param files array of files
 * @param mergeFunction merge function
 * @returns merged data
 */
export function mergeDataGlobal(files: Global[], mergeFunction: MergeFunction): Data | undefined {
    log.trace(`Merging data`);

    const dataArr = files.filter(el => el.data !== undefined).map(el => el.data);

    return mergeFunction({}, ...dataArr);
}

/** Merges data of layout with data of each layout in its layout chain and global data.
 * Stops at node that doesn't have a linked node or whose linked node doesn't exist.
 * If data property is undefined skips it.
 * @param file layout file for which to merge data
 * @param layouts array of layouts
 * @param mergeFunction merge function
 * @param globalData merged global data
 * @returns mutated layout file with the merged data in the `dataMerged` property
 */
// todo: warn when layout links to another layout that doesn't exist, similar to template below, similar to mergeDataLayout
// todo: warn when layout links to a cyclical dependency, similar to mergeDataLayout
export function mergeDataLayout(
    file: Layout,
    layouts: Layout[],
    mergeFunction: MergeFunction,
    globalData: Data
): Layout {
    log.trace(`Merging data`);

    const mergedData = walkChainIdMerge({
        startNode: file,
        nodeList: layouts,
        linkName: "layoutPathRelative",
        idName: "sourcePathRelativeRestSegment",
        mergeProperty: "data",
        mergeFunction: mergeFunction
    });

    // ignore local data if undefined
    // doesn't matter if globalData is undefined because then just stays undefined
    if (mergedData === undefined) {
        file.dataMerged = globalData;
        return file;
    }

    // doesn't matter if globalData is undefined because as left-most value in mergeFunction() gets merged away
    else {
        file.dataMerged = mergeFunction(globalData, mergedData);
        return file;
    }
}

/**
 * Merges data of template with data of each layout in its layout chain and global data
 * Simply merges with already merged data of its layout from mergeDataLayout()
 * If data property is undefined skips it
 * @param file template file for whic to merge data
 * @param layouts array of layouts
 * @param mergeFunction merge function
 * @param globalData merged global data
 */
export function mergeDataTemplate(
    file: Template,
    layouts: Layout[],
    mergeFunction: MergeFunction,
    globalData: Data
): Data {
    log.trace(`Merging data`);

    // has layout, merge local data with already merged data of layout
    if (file.layoutPathRelative) {
        // can choose first match because path in file system is unique
        const layout = layouts.find(lay => {
            return file.layoutPathRelative == lay.sourcePathRelativeRestSegment;
        });

        // layout exists, merge local data with already merged data of layout
        if (layout) {
            // don't use local data if undefined
            // doesn't matter if layout.dataMerged is undefined because then just stays undefined
            if (file.data === undefined) {
                return layout.dataMerged;
            }

            // doesn't matter if layout.dataMerged is undefined because as left-most value in mergeFunction() gets merged away
            else {
                return mergeFunction(layout.dataMerged, file.data);
            }
        }

        // layout doesn't exist, merge local data with global data
        else {
            console.warn(
                `Couldn't find layout ${file.layoutPathRelative} for template ${file.sourcePath}. Won't use it.`
            );

            // don't use local data if undefined
            // doesn't matter if globalData is undefined because then just stays undefined
            if (file.data === undefined) {
                return globalData;
            }

            // doesn't matter if globalData is undefined because as left-most value in mergeFunction() gets merged away
            else {
                return mergeFunction(globalData, file.data);
            }
        }
    }

    // has no layout, merge local data with global data
    else {
        // don't use local data if undefined
        // doesn't matter if globalData is undefined because then just stays undefined
        if (file.data === undefined) {
            return globalData;
        }

        // doesn't matter if globalData is undefined because as left-most value in mergeFunction() gets merged away
        else {
            return mergeFunction(globalData, file.data);
        }
    }
}
