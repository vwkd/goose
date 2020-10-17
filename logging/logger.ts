// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, getLevelName, LogLevels } from "./levels.ts";
import type { LevelName } from "./levels.ts";
import { ConsoleHandler, Handler } from "./handlers.ts";

export type GenericFunction = (...args: unknown[]) => void;

export interface LogRecordOptions {
  message: string;
  args: unknown[];
  level: number;
  loggerName: string;
}

export class LogRecord {
  readonly message: string;
  #args: unknown[];
  #datetime: Date;
  readonly level: number;
  readonly levelName: string;
  readonly loggerName: string;

  constructor(options: LogRecordOptions) {
    this.#args = [...options.args];
    this.#datetime = new Date();
    this.message = options.message;
    this.level = options.level;
    this.levelName = getLevelName(options.level);
    this.loggerName = options.loggerName;
  }
  get args(): unknown[] {
    return [...this.#args];
  }
  get datetime(): Date {
    return new Date(this.#datetime.getTime());
  }
}

const DEFAULT_LEVEL = "Info";
const DEFAULT_LOGGER_NAME = "logger";
// const defaultConsoleHandler = new ConsoleHandler(DEFAULT_LEVEL);
const DEFAULT_HANDLERS = [];

export class Logger {
  name: string;
  level: LogLevels;
  handlers: Handler[];
  silent: boolean;

  constructor({
    name = DEFAULT_LOGGER_NAME,
    levelName = DEFAULT_LEVEL,
    handlers = DEFAULT_HANDLERS,
    silent = false,
  }: { name?: string; levelName?: LevelName; handlers?: Handler[]; silent?: boolean } = {}) {
    this.name = name;
    this.level = getLevelByName(levelName);
    this.handlers = handlers;
    this.silent = silent;
  }

  get levelName(): LevelName {
    return getLevelName(this.level);
  }
  set levelName(levelName: LevelName) {
    this.level = getLevelByName(levelName);
  }

  /** If the level of the logger is greater than the level to log, then nothing
   * is logged, otherwise a log record is passed to each log handler.  `message` data
   * passed in is returned.  If a function is passed in, it is only evaluated
   * if the message will be logged and the return value will be the result of the
   * function, not the function itself, unless the function isn't called, in which
   * case undefined is returned.  All types are coerced to strings for logging.
   */
  private _log<T>(
    level: number,
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
      if(this.silent) {
          return;
      }
    if (this.level > level) {
      return;
    }

    let fnResult: T | undefined;
    let logMessage: string;
    if (message instanceof Function) {
      fnResult = message();
      logMessage = this.asString(fnResult);
    } else {
      logMessage = this.asString(message);
    }
    const record: LogRecord = new LogRecord({
      loggerName: this.name,
      message: logMessage,
      args: args,
      level: level,
    });

    this.handlers.forEach((handler): void => {
      handler.handle(record);
    });
  }

  asString(data: unknown): string {
    if (typeof data === "string") {
      return data;
    } else if (
      data === null ||
      typeof data === "number" ||
      typeof data === "bigint" ||
      typeof data === "boolean" ||
      typeof data === "undefined" ||
      typeof data === "symbol"
    ) {
      return String(data);
    } else if (typeof data === "object") {
      return JSON.stringify(data);
    }
    return "undefined";
  }

  trace<T>(message: () => T, ...args: unknown[]): void;
  trace<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  trace<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Trace, message, ...args);
  }

  debug<T>(message: () => T, ...args: unknown[]): void;
  debug<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  debug<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Debug, message, ...args);
  }

  info<T>(message: () => T, ...args: unknown[]): void;
  info<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  info<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Info, message, ...args);
  }

  warn<T>(message: () => T, ...args: unknown[]): void;
  warn<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  warn<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Warn, message, ...args);
  }

  error<T>(message: () => T, ...args: unknown[]): void;
  error<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  error<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Error, message, ...args);
  }

  critical<T>(message: () => T, ...args: unknown[]): void;
  critical<T>(
    message: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  critical<T>(
    message: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): void {
    return this._log(LogLevels.Critical, message, ...args);
  }
}
