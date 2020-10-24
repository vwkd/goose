// ------ mod.ts ------

export type Flags = {
    configPath: string;
    dryrun: boolean;
    // verbose: boolean;
    // quiet: boolean;
};

// ------ config.ts ------

export type Transformation = (str: string) => string;

export type MergeFunction = (target: unknown, ...source: unknown[]) => unknown;

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

// ------ build.ts ------

// only path metadata of file, doesn't contain contents, are in the more specific extensions, e.g. Global, Layout
export interface BaseFile {
    sourcePath: string;
    sourcePathRelative: string;
    sourceDirectory: string;
    sourceDirectoryRelative: string;
    sourceBase: string;
    sourceName: string;
    sourceExtension: string;
    sourceExtensionSecond: string;
    // todo: reconsider, maybe adding only on Template and Layout
    // sourcePathRelativeFirstSegment: string;
    sourcePathRelativeRestSegment: string;
    sourceDirectoryRelativeFirstSegment: string;
    // sourceDirectoryRelativeRestSegment: string;
    sourceDirectoryRelativeRestSegmentArr: string[];
    targetPath: string;
    targetPathRelative: string;
    targetDirectory: string;
    targetDirectoryRelative: string;
    targetBase: string;
    targetName: string;
    targetExtension: string;
    // todo: reconsider, maybe adding only on Template and Layout
    // targetPathRelativeFirstSegment: string;
    // targetPathRelativeRestSegment: string[];
    // targetDirectoryRelativeFirstSegment: string;
    // targetDirectoryRelativeRestSegment: string;
    // targetDirectoryRelativeRestSegmentArr: string[];
}

export interface Global extends BaseFile {
    data?: Data;
}

// todo: make separate types for each step, with only data & render, then with layoutPathRelative, then with dataMerged
export interface Layout extends BaseFile {
    // todo: maybe don't save data but merged data?
    data?: Data;
    render?: Render;
    layoutPathRelative?: string
    dataMerged?: Data;
}

export interface Template extends BaseFile {
    // todo: maybe don't save data but merged data?
    data?: Data;
    render?: Render;
    layoutPathRelative?: string
}

export type FileList = {
    assets: BaseFile[];
    globals: BaseFile[];
    layouts: BaseFile[];
    templates: BaseFile[];
    ignored: BaseFile[];
};

export type Data = unknown;

export type Render = (str: string) => Promise<string>;

export interface LayoutConfig {
    layoutPath: string;
}

export interface TemplateConfig extends LayoutConfig {
    targetPath: string;
}