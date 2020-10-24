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
interface File {
    sourcePath: string;
    sourcePathRelative: string;
    sourceDirectory: string;
    sourceDirectoryRelative: string;
    sourceBase: string;
    sourceName: string;
    sourceExtension: string;
    sourceExtensionSecond: string;
    // todo: reconsider, maybe adding only on Template and Layout
    sourceDirectoryRelativeFirstSegment: string;
    sourceDirectoryRelativeRestSegment: string[];
    targetPath: string;
    targetPathRelative: string;
    targetDirectory: string;
    targetDirectoryRelative: string;
    targetBase: string;
    targetName: string;
    targetExtension: string;
    // todo: reconsider, maybe adding only on Template and Layout
    targetDirectoryRelativeFirstSegment: string;
    targetDirectoryRelativeRestSegment: string[];
}

interface Global extends File {
    data?: Data;
}

interface Layout extends File {
    config?: Config;
    // todo: maybe don't save data but merged data?
    data?: Data;
    render?: Render;
}

interface Template extends File {
    config?: TemplateConfig;
    // todo: maybe don't save data but merged data?
    data?: Data;
    render?: Render;
}

type FileList = {
    assets: File[];
    templates: Template[];
    layouts: Layout[];
    globals: Global[];
    ignored: File[];
};

export type Data = object;

export type Render = (str: string) => Promise<string>;

export interface Config {
    layoutPath: string;
}

export interface TemplateConfig extends Config {
    targetPath: string;
}



//// todo OLD BELOW revise

export type LayoutConfigFunction = (layoutConfigArgument: LayoutConfigArgument) => Promise<void>;

export type TemplateConfigFunction = (TemplateConfigArgument: TemplateConfigArgument) => Promise<void>;

export type TemplateConfig = {
    targetPath: string;
    layoutPath: string;
};

export type TemplateConfigArgument = {
    targetPath: string;
    layoutPath: string;
};
