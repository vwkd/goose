import { log } from "./logger.ts";

export function build(options) {
    log.info("Build started.");

    log.debug(`Build options: ${JSON.stringify(options)}`);

    log.info("Build ended.");
}
