// ------ mod.ts ------

export type Flags = {
    configPath: string;
    dryrun: boolean;
    // verbose: boolean;
    // quiet: boolean;
}

// ------ config.ts ------

export type Transformation = (str: string) => string;

export type MergeFunction = (target: unknown, source: unknown) => unknown;

export type ConfigFunction = (configArgument: ConfigArgument) => Promise<void>;

export type Config = {
    source: string;
    target: string;
    ignoredFilename: string;
    ignoredDirname: string;
    layoutDirname: string;
    dataDirname: string;
    mergeFunction: MergeFunction;
    transformations: {
        [extensionPair: string]: Transformation[];
    };
    targetPathTransformation: {
        [extensionPair: string]: Transformation;
    };
    // incrementalBuild: boolean;
};

export type ConfigArgument = {
    source: string;
    target: string;
    ignoredFilename: string;
    ignoredDirname: string;
    layoutDirname: string;
    dataDirname: string;
    mergeFunction: MergeFunction;
    // incrementalBuild: boolean;
    getTransformations(sourceExt: string, targetExt: string): Transformation[] | undefined;
    setTransformations(sourceExt: string, targetExt: string, ...funcs: Transformation[]): void;
    getTargetPathTransformation(sourceExt: string, targetExt: string): Transformation | undefined;
    setTargetPathTransformation(sourceExt: string, targetExt: string, func: Transformation): void;
};