import { meta, minimist } from "./deps.ts";
import { build as build } from "./build.ts";
import { log } from "./logger.ts";
import { validateOptions } from "./validation.ts";
import type { options } from "./types.ts"

/**
 * Entry point of application
 * Parses CLI and file options, calls build
 */

// just run when it's not imported
if (import.meta.main) {
    log.info("Application started.");

    const defaultOptions = {
        // input: "src",
        // output: "dst",
        config: ".goose.json",
        dryrun: false,
        verbose: false,
        quiet: false
    };

    const options = {
        string: [/* "input", "output", */ "config"],
        boolean: ["dryrun", "verbose", "quiet", "help", "version"],
        alias: {
            // input: ["i", "source"],
            // output: ["o", "target"],
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
// -i, --input         source directory    "src"
// -o, --output        target directory    "dst"
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

    async function parseCommands(args) {
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
        else if (/* !args.input.trim() || !args.output.trim() || */ !args.config.trim()) {
            log.trace("Any empty path option.");
            printInvalid();
            printHelp();
        }

        // end of simple validation
        else {
            log.trace("Successfully passed validation.");

            const argsFiltered = {
                // input: args.input.trim(),
                // output: args.output.trim(),
                config: args.config.trim(),
                dryrun: args.dryrun,
                verbose: args.verbose,
                quiet: args.quiet
            };

            log.debug(`Filtered options: ${JSON.stringify(argsFiltered)}`);

            // read from config file
            // todo: convert config to .js module
            // todo: allow for non-existent config file
            // todo: move to config.ts module
            let config;
            try {
                config = JSON.parse(await Deno.readTextFile(argsFiltered.config));
            } catch (e) {
                log.error(`Couldn't read config file. ${e}`);
                throw new Error(`Couldn't read config file. ${e.message}`);
            }

            log.debug(`Loaded config: ${JSON.stringify(config)}`)

            // todo: validate options, e.g. build input != output, config not in input/output, etc.
            try {
                validateOptions(config);
            } catch (e) {
                log.error(`Found invalid option. ${e}`);
                throw new Error(`Found invalid option. ${e.message}`);
            }

            // todo: fix that defaults from minimist overwrite loaded config
            // const mergedConfig: options = Object.assign({}, config, argsFiltered);
            const mergedConfig: options = Object.assign({}, argsFiltered, config);

            try {
                await build(mergedConfig);
            } catch(e) {
                log.critical(`Error in build. ${e}`);
                throw new Error(`Found invalid option. ${e.message}`);
            }
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