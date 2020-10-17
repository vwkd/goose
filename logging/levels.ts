// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
/** Get log level numeric values through enum constants
 */

export enum LogLevelNames {
    Trace = "Trace",
    Debug = "Debug",
    Info = "Info",
    Warn = "Warn",
    Error = "Error",
    Critical = "Critical"
}

export enum LogLevels {
    Trace = 0,
    Debug = 10,
    Info = 20,
    Warn = 30,
    Error = 40,
    Critical = 50
}

/** Union of valid log level strings */
export type LevelName = keyof typeof LogLevels;

const byLevel: Record<string, LevelName> = {
    [LogLevels.Trace]: LogLevelNames.Trace,
    [LogLevels.Debug]: LogLevelNames.Debug,
    [LogLevels.Info]: LogLevelNames.Info,
    [LogLevels.Warn]: LogLevelNames.Warn,
    [LogLevels.Error]: LogLevelNames.Error,
    [LogLevels.Critical]: LogLevelNames.Critical
};

/** Returns the numeric log level associated with the passed,
 * stringy log level name.
 */
export function getLevelByName(name: LevelName): number {
    switch (name) {
        case LogLevelNames.Trace:
            return LogLevels.Trace;
        case LogLevelNames.Debug:
            return LogLevels.Debug;
        case LogLevelNames.Info:
            return LogLevels.Info;
        case LogLevelNames.Warn:
            return LogLevels.Warn;
        case LogLevelNames.Error:
            return LogLevels.Error;
        case LogLevelNames.Critical:
            return LogLevels.Critical;
        default:
            throw new Error(`no log level found for "${name}"`);
    }
}

/** Returns the stringy log level name provided the numeric log level */
export function getLevelName(level: number): LevelName {
    const levelName = byLevel[level];
    if (levelName) {
        return levelName;
    }
    throw new Error(`no level name found for level: ${level}`);
}
