// todo: outsource
const defaultOptions = {
    sourcePath: "./source/",
    targetPath: "./build",
    templateFiletypes: [".md", ".html"],
    configPath: "./.goose.js",
    dryrun: false,
    verbose: false,
    quiet: false,
}

export function parseOptions(options) {

    // overrides defaultOptions if options are available
    const parsedOptions = Object.assign({}, defaultOptions, options);

    return parsedOptions;
}