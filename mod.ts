import { log } from "./logger.ts";
import { meta, cliParse } from "./deps.ts";
import { loadConfig } from "./config.ts";
import { build } from "./build.ts";

// just run when module isn't imported
if (import.meta.main) {
    log.info("Application started.");

    const options = {
        string: ["config"],
        boolean: ["dryrun", /* "verbose", "quiet", */ "help", "version"],
        alias: {
            config: ["c"],
            dryrun: ["d"],
            // verbose: ["b"],
            // quiet: ["q"],
            help: ["h"],
            version: ["v"]
        }
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

    async function filterFlags(args) {
        log.debug(`User options: ${JSON.stringify(args)}`);

        // doesn't prevent senseless combination of multiple options
        // just yields to options by decreasing order of importance

        // if anywhere unknown option
        // also filters empty string config `-c ""`
        if (args._.length > 0) {
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
        const flags = {
            dryrun: args.dryrun,
            configPath: args.config?.trim(),
            // verbose: args.verbose,
            // quiet: args.quiet
        };

        return flags;
    }

    // ----- Parse CLI flags -----
    let flags = undefined;
    try {
        flags = await filterFlags(cliParse(Deno.args, options));
        log.debug(`Parsed flags: ${JSON.stringify(flags)}`);
    } catch (e) {
        log.critical(`Couldn't parse CLI flags. ${e.message}`);
        throw new Error(`Couldn't parse CLI flags. ${e.message}`);
    }

    // ----- Load config -----
    let config = undefined;
    try {
        config = await loadConfig(flags);
        log.debug(`Loaded config: ${JSON.stringify(config)}`);
    } catch (e) {
        log.critical(`Couldn't load config. ${e.message}`);
        throw new Error(`Couldn't load config. ${e.message}`);
    }

    // ----- Build files -----
    let stats = undefined;
    try {
        stats = await build(config, flags);
        log.debug(`Built files: ${JSON.stringify(stats)}`);
    }catch (e) {
        log.critical(`Couldn't build files. ${e.message}`);
        throw new Error(`Couldn't build files. ${e.message}`);
    }

    log.info("Application ended.");
}
