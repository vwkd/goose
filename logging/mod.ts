// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import type { Handler } from "./handlers.ts";
import type { LevelName } from "./levels.ts";

export { LogLevels } from "./levels.ts";
export type { LevelName } from "./levels.ts";
export { Logger } from "./logger.ts";
export { LogLevelNames } from "./levels.ts";

export class LoggerConfig {
  level?: LevelName;
  handlers?: Handler[];
}

export interface LogConfig {
  [name: string]: LoggerConfig;
}

export {
  ConsoleHandler,
  FileHandler,
  Handler,
  RotatingFileHandler,
  WriterHandler,
} from "./handlers.ts";
