import { log } from "../logger.ts";
import { pathParse, pathSeparator } from "../deps.ts";
import type { Transformation, Template } from "../types.ts";

/**
 * Transforms string through a series of transformations
 * Each transform is awaited.
 * @param str string to transform
 * @param transformations array of transform functions
 */
export async function transformTemplate(str: string,
    transformations: Transformation[] | undefined): Promise<string> {
    log.trace(`Transforming`);

    // transformations may be undefined if no transforms were added, then returns unmodified string
    // transforms themselves aren't undefined since validated in setTransformations in config.ts
    const transformedString =
        await transformations?.reduce(async (acc, transform) => {
            await acc;

            const str = await transform(acc);
            if (typeof str != "string") {
                throw new Error(`The transformation "${transform.name || "(anonymous)"}" must return a string.`);
            }
            return str;
        }, str) ?? str;

    return transformedString;
}

/**
 * Transforms the targetPath of a template using a transform function
 * The transform is awaited.
 * @param file template whose targetPath is mutated
 * @param targetPathTransform transform function that mutates the targetPath of the template
 */
export async function transformTargetPathTemplate(
    file: Template,
    targetPathTransform: Transformation
): Promise<void> {
    log.trace(`Transforming target path`);

    // targetPathTransform may be undefined if not added, then don't do anything
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
