import { ConsoleHandler, FileHandler, Logger, LogLevelNames } from "./deps.ts";
import { meta } from "./deps.ts";
import { dotenv } from "./deps.ts";
import { capitalise, booleanise } from "./utils.ts";
export { log, LogLevelNames };

const envDefault = {
    LOG_CONSOLE: false,
    LOG_FILE: false,
    LOG_PATH: "log.txt",
    LOG_LEVEL: LogLevelNames.Info
};

dotenv({ export: true });

// use ?? instead of || because helper functions return desired value or undefined
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
        let lastTime = Date.now();
        handlers.push(
            new ConsoleHandler(LOG_LEVEL, {
                formatter: function ({ levelName, message }) {
                    const currentTime = Date.now();
                    const delay = currentTime - lastTime;
                    lastTime = currentTime;
                    return `[${meta.name}]: ${levelName.toUpperCase()} ${message} +${delay}ms`;
                }
            })
        );
    }

    if (LOG_FILE) {
        let lastTime = Date.now();
        handlers.push(
            new FileHandler(LOG_LEVEL, {
                filename: LOG_PATH,
                formatter: function ({ levelName, message }) {
                    const currentTime = Date.now();
                    const delay = currentTime - lastTime;
                    lastTime = currentTime;
                    return `[${meta.name}]: ${levelName.toUpperCase()} ${message} +${delay}ms`;
                }
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
    log = new Logger({ name: meta.name });
}
