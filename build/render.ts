import { log } from "../logger.ts";
import { Template, Data, Layout } from "../types.ts";
import { walkChainIdCall } from "../deps.ts"

export async function renderTemplate(file: Template, layouts: Layout[], data: Data) {
    log.trace(`Rendering`);

    async function tryRender(node, lastValue, data) {
        let str = undefined;
        try {
            // await just incase render function is async
            str = await node.render(data, lastValue);
        } catch (e) {
            throw new Error(`Template ${node.sourcePath} render function threw an error. ${e.message}`);
        }

        if (typeof str != "string") {
            throw new Error(`Template ${node.sourcePath} render function must return a string.`);
        }
        return str;
    }

    // loops until first layout without a render function
    // todo: what happens if layout itself doesn't have one?
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
