import { meta, minimist } from "./deps.ts";
import { build } from "./build.ts";
import { log } from "./logger.ts";

log.info("Application started.");

const defaultOptions = {
    input: "src",
    output: "dst",
    config: ".goose.js",
    dryrun: false,
    verbose: false,
    quiet: false
};

const options = {
    string: ["input", "output", "config"],
    boolean: ["dryrun", "verbose", "quiet", "help", "version"],
    alias: {
        input: ["i", "source"],
        output: ["o", "target"],
        config: ["c"],
        dryrun: ["d"],
        verbose: ["b"],
        quiet: ["q"],
        help: ["h"],
        version: ["v"]
    },
    default: defaultOptions
};

function printVersion() {
    console.log(`${meta.name} v${meta.version}`);
}

// todo: specify default values
function printHelp() {
    console.log(`usage: ${meta.name} [<options>]`);
    console.log(`
Options:            Description:        Default:
-i, --input         source directory    "src"
-o, --output        target directory    "dst"
-c, --config        config path         ".goose.js"
-d, --dryrun        dry run
-b, --verbose       log more
-q, --quiet         log less
-h, --help          show help
-v, --version       print version
`);
}

function printInvalid() {
    console.log(`Invalid input.`);
}

parseCommands(minimist(Deno.args, options));

function parseCommands(args) {
    log.debug(`User options: ${JSON.stringify(args)}`);

    // doesn't prevent senseless combination of multiple options
    // just yields to options by decreasing order of importance
    // doesn't validate paths except that non-empty

    // if anywhere unknown option
    if (args._.length > 0) {
        log.trace("Anywhere unknown option.");
        printInvalid();
        printHelp();
    }

    // if anywhere help
    else if (args.help) {
        log.trace("Anywhere help option.");
        printHelp();
    }

    // if anywhere version
    else if (args.version) {
        log.trace("Anywhere version option.");
        printVersion();
    }

    // if both verbose and quiet
    else if (args.verbose && args.quiet) {
        log.trace("Both verbose and quiet option.");
        printInvalid();
        printHelp();
    }

    // if any path is empty
    // note: if undefined by user, would have default value which is non-empty
    else if (!args.input.trim() || !args.output.trim() || !args.config.trim()) {
        log.trace("Any empty path option.");
        printInvalid();
        printHelp();
    }

    // end of simple validation
    else {
        log.trace("Successfully passed validation.");

        const argsFiltered = {
            input: args.input.trim(),
            output: args.output.trim(),
            config: args.config.trim(),
            dryrun: args.dryrun,
            verbose: args.verbose,
            quiet: args.quiet
        };

        log.debug(`Filtered options: ${JSON.stringify(argsFiltered)}`);

        build(argsFiltered);
    }
}

log.info("Application ended.");
