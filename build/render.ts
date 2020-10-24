import { log } from "../logger.ts";
import { Template, Data, Layout } from "../types.ts";
import { walkChainIdCall } from "../deps.ts";

/**
 * Renders template using each render function of in its layout chain.
 * Each render function is given the data as first argument and the result of the previous render as second.
 * Stops at node that doesn't have a linked node or whose linked node doesn't exist.
 * If render property is undefined skips it.
 * Each render function is awaited.
 * @param file template to render
 * @param layouts array of layouts
 * @param data data that is passed as first argument to each render function
 */
// todo: what if render on template itself doesn't exist? Then should not render it... Not return lastValue which is undefined...
// todo: warn when layout links to another layout that doesn't exist, similar to mergeDataLayout
// todo: warn when layout links to a cyclical dependency, similar to mergeDataLayout
export async function renderTemplate(file: Template, layouts: Layout[], data: Data) {
    log.trace(`Rendering template`);

    if(file.render === undefined) {
        // todo: don't output template
    }

    async function tryRender(node: Template | Layout, lastValue: string, data: Data) {
        const render = node.render;

        // doesn't have a render function, skip
        if (render === undefined) {
            return lastValue;
        }

        // has render function
        else {
            let str: string | undefined = undefined;
            try {
                str = await render(data, lastValue);
            } catch (e) {
                throw new Error(`Template ${node.sourcePath} render function threw an error. ${e.message}`);
            }
            if (typeof str != "string") {
                throw new Error(`Template ${node.sourcePath} render function must return a string.`);
            }
            return str;
        }
    }

    const renderedContent = await walkChainIdCall({
        startNode: file,
        nodeList: layouts,
        linkName: "layoutPathRelative",
        idName: "sourcePathRelativeRestSegment",
        callback: tryRender,
        data: data
    });

    return renderedContent;
}
