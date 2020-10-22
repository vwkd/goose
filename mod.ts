import { log } from "./logger.ts";
import { meta, cliParse } from "./deps.ts";
import { getConfig } from "./config.ts";
import { build } from "./build.ts";
import type { Flags, Config } from "./types.ts";
import type { Args, ArgParsingOptions } from "./deps.ts";

let unknownOption: boolean = false;

const options: ArgParsingOptions = {
    string: ["config"],
    boolean: ["dryrun", /* "verbose", "quiet", */ "help", "version"],
    alias: {
        config: ["c"],
        dryrun: ["d"],
        // verbose: ["b"],
        // quiet: ["q"],
        help: ["h"],
        version: ["v"]
    },
    unknown: () => {unknownOption = true; return false}
};

function printVersion() {
    console.log(`${meta.name} v${meta.version}`);
}

function printHelp() {
    console.log(`usage: ${meta.name} [<options>]`);
    console.log(`
Options:            Description:        Default:
-c, --config        config path         ".goose.js"
-d, --dryrun        dry run
// -b, --verbose       log more
// -q, --quiet         log less
-h, --help          show help
-v, --version       print version
`);
}

function printInvalid() {
    console.log(`Invalid input.`);
}

async function filterFlags(args: Args): Promise<Flags | undefined> {
    log.debug(`User options: ${JSON.stringify(args)}`);

    // doesn't prevent senseless combination of multiple options
    // just yields to options by decreasing order of importance

    // if anywhere unknown option
    // also filters empty string config `-c ""`, but doesn't filter `-c` without any argument!
    if (unknownOption) {
        log.trace("Anywhere unknown option.");
        printInvalid();
        printHelp();
        return undefined;
    }

    // if anywhere help
    else if (args.help) {
        log.trace("Anywhere help option.");
        printHelp();
        return undefined;
    }

    // if anywhere version
    else if (args.version) {
        log.trace("Anywhere version option.");
        printVersion();
        return undefined;
    }

    // if both verbose and quiet
    /*         else if (args.verbose && args.quiet) {
        log.trace("Both verbose and quiet option.");
        printInvalid();
        printHelp();
    } */

    // configPath is undefined if -c isn't provided
    const flags: Flags = {
        dryrun: args.dryrun,
        configPath: args.config
        // verbose: args.verbose,
        // quiet: args.quiet
    };

    return flags;
}

// just run when module isn't imported
if (import.meta.main) {
    log.info("Application started.");

    // ----- Parse CLI flags -----
    let flags: Flags | undefined = undefined;
    try {
        flags = await filterFlags(cliParse(Deno.args, options));
    } catch (e) {
        log.critical(`Couldn't parse CLI flags. ${e.message}`);
        throw new Error(`Couldn't parse CLI flags. ${e.message}`);
    }
    log.debug(`Parsed flags: ${JSON.stringify(flags)}`);

    // only run when filterFlags returned flags
    if (flags) {
        // ----- Load config -----
        let config: Config | undefined = undefined;
        try {
            config = await getConfig(flags);
        } catch (e) {
            log.critical(`Couldn't load config. ${e.message}`);
            throw new Error(`Couldn't load config. ${e.message}`);
        }
        log.debug(`Loaded config: ${JSON.stringify(config)}`);

        // ----- Build files -----
        let stats: TODO | undefined = undefined;
        try {
            stats = await build(config, flags);
        } catch (e) {
            log.critical(`Couldn't build files. ${e.message}`);
            throw new Error(`Couldn't build files. ${e.message}`);
        }
        log.debug(`Built files: ${JSON.stringify(stats)}`);
    }

    log.info("Application ended.");
}
