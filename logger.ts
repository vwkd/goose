import { ConsoleHandler, FileHandler, Logger, LogLevels, LevelName } from "./deps.ts";
import { meta } from "./deps.ts";
import { dotenv } from "./deps.ts";
import { capitalise, booleanise } from "./utils.ts";

type EnvironmentalVariables = {
    LOG_CONSOLE: boolean;
    LOG_FILE: boolean;
    LOG_PATH: string;
    LOG_LEVEL: LevelName;
};

const envDefault: EnvironmentalVariables = {
    LOG_CONSOLE: false,
    LOG_FILE: false,
    LOG_PATH: "log.txt",
    LOG_LEVEL: "Info"
};

dotenv({ export: true });

// use ?? instead of || because helper functions return desired value or undefined
const LOG_CONSOLE = booleanise(Deno.env.get("LOG_CONSOLE")) ?? envDefault.LOG_CONSOLE;
const LOG_FILE = booleanise(Deno.env.get("LOG_FILE")) ?? envDefault.LOG_FILE;
// use || instead of ?? because wants to default also for empty string
const LOG_PATH = Deno.env.get("LOG_PATH") || envDefault.LOG_PATH;

const loglevel = capitalise(Deno.env.get("LOG_LEVEL"));
let LOG_LEVEL: LevelName | undefined = undefined
if (loglevel === undefined) {
    LOG_LEVEL = envDefault.LOG_LEVEL;
} else if (Object.keys(LogLevels).includes(loglevel)) {
    LOG_LEVEL = loglevel as LevelName
} else {
    console.error(`Couldn't find a LOG_LEVEL ${LOG_LEVEL}. Will continue with "Info".`)
    LOG_LEVEL = envDefault.LOG_LEVEL;
}

export const log = (function () {
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

        return new Logger({
            name: meta.name,
            levelName: LOG_LEVEL,
            handlers: handlers
        });
    }

    // logging off
    else {
        return new Logger({ name: meta.name });
    }
})();
