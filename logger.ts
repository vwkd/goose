// import { Logger } from "./deps.ts";
import { ConsoleHandler, FileHandler, Logger, LogLevelNames } from "./deps.ts";
import { meta } from "./deps.ts";
export { log, LogLevelNames };

// todo: default options
const logLevel = LogLevelNames.Trace;
const c = false;
const f = "log.txt";

let log = undefined;

// logging on
if (c || f) {
    const handlers = [];
    // logging to console
    if (c) {
        handlers.push(
            new ConsoleHandler(logLevel, {
                formatter: ({ levelName, message }) =>
                    `[${meta.name}]: ${levelName.toUpperCase()} ${message}`
            })
        );
    }

    // logging to file
    if (f) {
        handlers.push(
            new FileHandler(logLevel, {
                filename: f,
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
        levelName: logLevel,
        handlers: handlers
    });
}

// logging off
else {
    log = new Logger({ name: meta.name });
}

// if logging to file
// if logging to console + file

// if logging to console + file

const consoleHandler = new ConsoleHandler(logLevel, {
    formatter: ({ levelName, message }) => `[${meta.name}]: ${levelName.toUpperCase()} ${message}`
});

const fileHandler = new FileHandler(logLevel, {
    filename: "./log.txt",
    formatter: ({ levelName, message }) =>
        `${new Date().toISOString()} [${meta.name}]: ${levelName.toUpperCase()} ${message}`
});

const log111 = new Logger({
    name: meta.name,
    levelName: logLevel,
    handlers: [consoleHandler, fileHandler]
});
