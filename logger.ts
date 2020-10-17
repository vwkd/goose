// import { Logger } from "./deps.ts";
import { ConsoleHandler, FileHandler, Logger, LogLevelNames } from "./deps.ts";
import { meta } from "./deps.ts";
export { log, LogLevelNames };

// todo: allow enabling logging via ENV flags, set level if logging is enabled
// respects LOG_LEVEL only if LOG_CONSOLE and/or LOG_FILE
// respects LOG_PATH only if LOG_FILE is set
const LOG_CONSOLE = true;
const LOG_FILE = false;
const LOG_PATH = "log.txt";
const LOG_LEVEL = LogLevelNames.Trace;

// todo: use defaults if no ENV flag provided
const logOptionsDefault = {
    console: false,
    file: false,
    path: "log.txt",
    level: LogLevelNames.Info
};

let log = undefined;

// logging on
if (LOG_CONSOLE || LOG_FILE) {
    const handlers = [];
    // logging to console
    if (LOG_CONSOLE) {
        handlers.push(
            new ConsoleHandler(LOG_LEVEL, {
                formatter: ({ levelName, message }) =>
                    `[${meta.name}]: ${levelName.toUpperCase()} ${message}`
            })
        );
    }

    // logging to file
    if (LOG_FILE) {
        handlers.push(
            new FileHandler(LOG_LEVEL, {
                filename: LOG_PATH,
                formatter: ({ levelName, message }) =>
                    `${new Date().toISOString()} [${
                        meta.name
                    }]: ${levelName.toUpperCase()} ${message}`
            })
        );
    }

    // logging to both console and file
    log = new Logger({
        name: meta.name,
        levelName: LOG_LEVEL,
        handlers: handlers
    });
}

// logging off
else {
    log = new Logger({ name: meta.name });
}
