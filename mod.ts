import { meta, minimist } from "./deps.ts";
import { build } from "./build.ts";
import { log, LogLevelNames } from "./logger.ts";

// todo: allow enabling logging for console or file via CLI / ENV FLAG, set level if logging is enabled
// NO! LOGGING IS NOT USER FEATURE BUT PROGRAMMER FEATURE, ENABLE BASED ON ENVIRONMENT
log.level = LogLevelNames.Trace;
log.error("HEERLEKJR");

const defaultOptions = {
    input: "src",
    output: "dst",
    config: ".goose.js",
    loglevel: "info",
    logpath: "log.txt",
    dryrun: false,
    verbose: false,
    quiet: false
};

const options = {
    string: ["input", "output", "config", "loglevel", "logpath"],
    boolean: ["logconsole", "logfile", "dryrun", "verbose", "quiet", "help", "version"],
    alias: {
        input: ["i", "source"],
        output: ["o", "target"],
        config: ["c"],
        dryrun: ["d"],
        logconsole: ["lc"],
        logfile: ["lf"],
        loglevel: ["ll"],
        logpath: ["lp"],
        verbose: ["b"],
        quiet: ["q"],
        help: ["h"],
        version: ["v"]
    },
    default: defaultOptions,
    unknown: printHelpAndExit
};

function printVersion() {
    console.log(`${meta.name} v${meta.version}`);
}

// todo: specify default values
function printHelp() {
    console.log(`usage: ${meta.name} [<options>]`);
    console.log(`
Options:            Description:        Default:       Notes:
-i, --input         source directory    "src"
-o, --output        target directory    "dst"
-c, --config        config path         ".goose.js"
-d, --dryrun        dry run
--lc, --logconsole  log to console
--lf, --logfile     log to file
--lp, --logpath     log path            "log.txt"      (requires -lf)
--ll, --loglevel    log level           "info"         (requires -lc and/or -lf)
-b, --verbose       log more
-q, --quiet         log less
-h, --help          show help
-v, --version       print version
`);
}

function printInvalid() {
    console.log(`Invalid input.`);
}

function printHelpAndExit() {
    printInvalid();
    printHelp();
    Deno.exit();
}

parseCommands(minimist(Deno.args, options));

function parseCommands(args) {
    log.debug("User options:", args);

    // doesn't prevent senseless combination of multiple options
    // just yields to options by decreasing order of importance
    // doesn't validate paths except that non-empty

    // if anywhere help
    if (args.help) {
        printHelp();
    }

    // if anywhere version
    else if (args.version) {
        printVersion();
    }

    // if loglevel without logs
    else if (args.loglevel !== defaultOptions.loglevel && !args.logconsole && !args.logfile) {
        printInvalid();
        printHelp();
    }

    // if logpath without log to file
    else if (args.logpath !== defaultOptions.logpath && !args.logfile) {
        printInvalid();
        printHelp();
    }

    // if both verbose and quiet
    else if (args.verbose && args.quiet) {
        printInvalid();
        printHelp();
    }

    // if any path is empty
    // note: if undefined by user, would have default value which is non-empty
    else if (
        !args.input.trim() ||
        !args.output.trim() ||
        !args.config.trim() ||
        !args.logpath.trim() ||
        !args.loglevel.trim()
    ) {
        printInvalid();
        printHelp();
    }

    // end of simple validation
    else {
        const argsFiltered = {
            input: args.input.trim(),
            output: args.output.trim(),
            config: args.config.trim(),
            dryrun: args.dryrun,
            verbose: args.verbose,
            quiet: args.quiet
        };

        build(argsFiltered);
    }
}
