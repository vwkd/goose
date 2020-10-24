import { log } from "../logger.ts";
import { pathParse, pathSeparator } from "../deps.ts";
import type { Transformation, Template } from "../types.ts";

export async function transformTemplate(
    file: Template,
    renderedString: string,
    transformations: { [extensionPair: string]: Transformation[] }
): Promise<string> {
    log.trace(`Transforming`);

    // may be undefined if none were added
    const transforms = transformations[file.sourceExtensionSecond + file.targetExtension];

    // if undefined, defaults to renderedString
    const transformedString =
        transforms?.reduce((acc, transform) => {
            const str = transform(acc);
            if (typeof str != "string") {
                throw new Error(`The transformation "${transform.name || "(anonymous)"}" must return a string.`);
            }
            return str;
        }, renderedString) ?? renderedString;

    return transformedString;
}

// modifies file directly
// todo: compute new file with new properties, can type better, however looses the automatic propagation to all other properties ?!
// todo: use only if targetPath wasn't set using template data
// todo: maybe allow for multiple, only useful if extensions have overlap via wildcard, e.g. .md -> .html, and .md -> *, but what is order?
export async function transformTargetPathTemplate(
    file: Template,
    targetPathTransformation: { [extensionPair: string]: Transformation }
): Promise<void> {
    log.trace(`Transforming target path`);

    // may be undefined if none was added
    // targetExtension may be empty if user provided targetPath in template data didn't include extension
    // todo: what to do if file.targetExtension is empty?
    const targetPathTransform = targetPathTransformation[file.sourceExtensionSecond + file.targetExtension];

    // console.log(file.targetExtension, typeof file.targetExtension)
    // console.log(targetPathTransform)

    if (targetPathTransform) {
        const targetPathRelativeTransformed = await targetPathTransform(file.targetPathRelative);
        if (typeof targetPathRelativeTransformed != "string") {
            throw new Error(
                `The targetPath returned by targetPathTransform for ${file.sourceExtensionSecond} -> ${file.targetExtension} must be a string.`
            );
        }
        if (targetPathRelativeTransformed.trim() == "") {
            throw new Error(
                `The targetPath returned by targetPathTransform for ${file.sourceExtensionSecond} -> ${file.targetExtension} must be a non-empty non-whitespace-only string.`
            );
        }
        const path = pathParse(targetPathRelativeTransformed);
        if (path.dir.split(pathSeparator).includes("..")) {
            throw new Error(
                `The targetPath returned by targetPathTransform for ${file.sourceExtensionSecond} -> ${file.targetExtension} must not contain ".." path segments.`
            );
        }
        file.targetPathRelative = targetPathRelativeTransformed;
    }
}
