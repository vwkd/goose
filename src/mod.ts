// entry point
// parse CLI arguments, build config object, call mainWorker with config object

// TODO: clarify help, specify type, default values, ....
// TODO: validate arguments, e.g. input != output folder, not both short- & longhand like -i="abc" --source="dfg", etc.
// todo: use argument parser with validation, proper aliasing

import { meta, log, cliParse, goose } from "./deps.ts";

if (import.meta.main) {
    const { _, ...parsedArgs } = cliParse(Deno.args);

    console.debug("command line arguments:", _, parsedArgs);

    if (parsedArgs.v || parsedArgs.version) {
        log.info(`${meta.name} v${meta.version}`);
    }

    if (parsedArgs.h || parsedArgs.help) {
        log.info(`usage: ${meta.name} [<options>]

        -i, --source        source folder ??? input
        -o, --target        target folder ??? ouput
        -f, --format        processed file types ??? NEEDED???
        //-p, --pathprefix    url template filter folder ???
        -c, --config        path to config

        -n, --dry-run       dry run
        -v, --verbose       be verbose
        -q, --quiet         be quiet ??? quiet
        
        -v, --version       print version
        -h, --help          print help
        `);
    }

    // may have irregular options, just won't use later
    // todo: remove in favor of argument parser with validation
    const options = {
        source: (parsedArgs.i || parsedArgs.source),
        target: (parsedArgs.o || parsedArgs.target),
        format: (parsedArgs.f || parsedArgs.format),
        config: (parsedArgs.c || parsedArgs.config),
        dryrun: (parsedArgs.n || parsedArgs.dryrun),
        verbose: (parsedArgs.v || parsedArgs.verbose),
        quiet: (parsedArgs.q || parsedArgs.quiet),
    }

    goose(options);
}