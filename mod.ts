import { meta, minimist } from "./deps.ts";
import { build } from "./build.ts";
import { log } from "./logger.ts";
import { loadConfig, validateConfig } from "./config.ts";

/**
 * Entry point of application
 * Parses CLI and file options, calls build
 */

// just run when it's not imported
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
        },
    };

    function printVersion() {
        console.log(`${meta.name} v${meta.version}`);
    }

    // todo: specify default values
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

    async function parseCommands(args) {
        log.debug(`User options: ${JSON.stringify(args)}`);

        // doesn't prevent senseless combination of multiple options
        // just yields to options by decreasing order of importance

        // if anywhere unknown option
        // also conveniently filters an empty string config `-c ""`
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
/*         else if (args.verbose && args.quiet) {
            log.trace("Both verbose and quiet option.");
            printInvalid();
            printHelp();
        } */

        else {
            const globalFlags = {
                dryrun: args.dryrun,
                // verbose: args.verbose,
                // quiet: args.quiet
            }

            log.debug(`Global flags: ${JSON.stringify(globalFlags)}`);

            const config = await loadConfig(args.config?.trim(), globalFlags);

            log.debug(`Loaded config: ${JSON.stringify(config)}`);

            validateConfig(config);

            await build(config, globalFlags);
        }
    }

    try {
        await parseCommands(minimist(Deno.args, options));
    } catch (e) {
        // todo: write descriptive error message, outer most error handler
        log.critical(`Error in parsing. ${e}`);
        throw new Error(`Error in parsing. ${e.message}`);
    }

    log.info("Application ended.");
}
