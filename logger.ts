// import { Logger } from "./deps.ts";
import { ConsoleHandler, FileHandler, Logger, LogLevelNames } from "./deps.ts";
import { meta } from "./deps.ts";
import { dotenv } from "./deps.ts";
export { log, LogLevelNames };
import { capitalise, booleanise } from "./utils.ts"

// respects LOG_LEVEL only if LOG_CONSOLE and/or LOG_FILE is set
// respects LOG_PATH only if LOG_FILE is set

const envDefault = {
    LOG_CONSOLE: false,
    LOG_FILE: false,
    LOG_PATH: "log.txt",
    LOG_LEVEL: LogLevelNames.Info
};

dotenv({export: true});

// use ?? instead of || because functions return desired value or undefined
const LOG_CONSOLE = booleanise(Deno.env.get("LOG_CONSOLE")) ?? envDefault.LOG_CONSOLE;
const LOG_FILE = booleanise(Deno.env.get("LOG_FILE")) ?? envDefault.LOG_FILE;
const LOG_LEVEL = capitalise(Deno.env.get("LOG_LEVEL")) ?? envDefault.LOG_LEVEL;
// use || instead of ?? because wants to default also for empty string
const LOG_PATH = Deno.env.get("LOG_PATH") || envDefault.LOG_PATH;

let log = undefined;

// logging on
if (LOG_CONSOLE || LOG_FILE) {
    const handlers = [];

    if (LOG_CONSOLE) {
        handlers.push(
            new ConsoleHandler(LOG_LEVEL, {
                formatter: ({ levelName, message }) =>
                    `[${meta.name}]: ${levelName.toUpperCase()} ${message}`
            })
        );
    }

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

    log = new Logger({
        name: meta.name,
        levelName: LOG_LEVEL,
        handlers: handlers
    });
}

// logging off
else {
    log = new Logger({ name: meta.name, handlers: [] });
}
