// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, LevelName, LogLevels } from "./levels.ts";
import type { LogRecord } from "./logger.ts";
import { blue, red, yellow, bold } from "https://deno.land/std@0.74.0/fmt/colors.ts";
import { existsSync } from "https://deno.land/std@0.74.0/fs/exists.ts";
import { BufWriterSync } from "https://deno.land/std@0.74.0/io/bufio.ts";

function defaultFormatter({ levelName, message, args }: LogRecord) {
  args.forEach((argument) => {
    message += ` ${argument}`;
  });
  return `${levelName} ${message}`;
}
type FormatterFunction = (logRecord: LogRecord) => string;
type LogMode = "a" | "w" | "x";

interface HandlerOptions {
  formatter?: FormatterFunction;
}

export class Handler {
  level: number;
  levelName: LevelName;
  formatter: FormatterFunction;

  constructor(
    levelName: LevelName,
    { formatter = defaultFormatter }: HandlerOptions = {},
  ) {
    this.level = getLevelByName(levelName);
    this.levelName = levelName;
    this.formatter = formatter;
  }

  handle(logRecord: LogRecord): void {
    if (this.level > logRecord.level) return;

    const message = this.formatter(logRecord);
    switch (logRecord.level) {
      case LogLevels.Trace:
        this.trace(message);
        break;
      case LogLevels.Debug:
        this.debug(message);
        break;
      case LogLevels.Info:
        this.info(message);
        break;
      case LogLevels.Warn:
        this.warn(message);
        break;
      case LogLevels.Error:
        this.error(message);
        break;
      case LogLevels.Critical:
        this.critical(message);
        break;
      default:
        throw Error(`logLevel is invalid`);
    }
  }
  trace(_message: string): void {}
  debug(_message: string): void {}
  info(_message: string): void {}
  warn(_message: string): void {}
  error(_message: string): void {}
  critical(_message: string): void {}
}

export class ConsoleHandler extends Handler {
  trace(message: string): void {
    console.log(message);
  }
  debug(message: string): void {
    console.log(message);
  }
  info(message: string): void {
    console.info(blue(message));
  }
  warn(message: string): void {
    console.warn(yellow(message));
  }
  error(message: string): void {
    console.error(red(message));
  }
  critical(message: string): void {
    console.error(red(bold(message)));
  }
}

export abstract class WriterHandler extends Handler {
  protected _writer!: Deno.Writer;
  abstract open(): void;
  abstract write(message: string): void;
  abstract close(): void;
}

interface FileHandlerOptions extends HandlerOptions {
  filename: string;
  mode?: LogMode;
}

export class FileHandler extends WriterHandler {
  protected _file: Deno.File | undefined;
  protected _buf!: BufWriterSync;
  protected _filename: string;
  protected _mode: LogMode;
  protected _openOptions: Deno.OpenOptions;
  protected _encoder = new TextEncoder();
  #unloadCallback = (): void => this.close();

  constructor(levelName: LevelName, options: FileHandlerOptions) {
    super(levelName, options);
    this._filename = options.filename;
    // default to append mode, write only
    this._mode = options.mode ? options.mode : "a";
    this._openOptions = {
      createNew: this._mode === "x",
      create: this._mode !== "x",
      append: this._mode === "a",
      truncate: this._mode !== "a",
      write: true,
    };
  }

  trace(message: string): void {
    this.write(message);
  }
  debug(message: string): void {
    this.write(message);
  }
  info(message: string): void {
    this.write(message);
  }
  warn(message: string): void {
    this.write(message);
  }
  error(message: string): void {
    this.write(message);
  }
  critical(message: string): void {
    this.write(message);
  }

  open(): void {
    this._file = Deno.openSync(this._filename, this._openOptions);
    this._writer = this._file;
    this._buf = new BufWriterSync(this._file);

    addEventListener("unload", this.#unloadCallback);
  }
  write(message: string): void {
    if (!this._buf) this.open();
    this._buf.writeSync(this._encoder.encode(message + "\n"));
  }
  close(): void {
    this.flush();
    this._file?.close();
    this._file = undefined;
    removeEventListener("unload", this.#unloadCallback);
  }
  flush(): void {
    if (this._buf?.buffered() > 0) {
      this._buf.flush();
    }
  }
}

interface RotatingFileHandlerOptions extends FileHandlerOptions {
  maxBytes: number;
  maxBackupCount: number;
}

export class RotatingFileHandler extends FileHandler {
  #maxBytes: number;
  #maxBackupCount: number;
  #currentFileSize = 0;

  constructor(levelName: LevelName, options: RotatingFileHandlerOptions) {
    super(levelName, options);
    this.#maxBytes = options.maxBytes;
    this.#maxBackupCount = options.maxBackupCount;
  }

  open(): void {
    if (this.#maxBytes < 1) {
      this.close();
      throw new Error("maxBytes cannot be less than 1");
    }
    if (this.#maxBackupCount < 1) {
      this.close();
      throw new Error("maxBackupCount cannot be less than 1");
    }
    super.open();

    switch (this._mode) {
      case "w":
        for (let i = 1; i <= this.#maxBackupCount; i++) {
          if (existsSync(this._filename + "." + i)) {
            Deno.removeSync(this._filename + "." + i);
          }
        }
        break;
      case "x":
        for (let i = 1; i <= this.#maxBackupCount; i++) {
          if (existsSync(this._filename + "." + i)) {
            this.close();
            throw new Deno.errors.AlreadyExists(
              "Backup log file " + this._filename + "." + i + " already exists",
            );
          }
        }
        break;
      default:
        this.#currentFileSize = (Deno.statSync(this._filename)).size;
        break;
    }
  }
  write(message: string): void {
    const messageByteLength = this._encoder.encode(message).byteLength + 1;

    if (this.#currentFileSize + messageByteLength > this.#maxBytes) {
      this.rotateLogFiles();
      this.#currentFileSize = 0;
    }

    super.write(message);
    this.#currentFileSize += messageByteLength;
  }

  rotateLogFiles(): void {
    this._buf.flush();
    Deno.close(this._file!.rid);

    for (let i = this.#maxBackupCount - 1; i >= 0; i--) {
      const source = this._filename + (i === 0 ? "" : "." + i);
      const dest = this._filename + "." + (i + 1);

      if (existsSync(source)) {
        Deno.renameSync(source, dest);
      }
    }

    this._file = Deno.openSync(this._filename, this._openOptions);
    this._writer = this._file;
    this._buf = new BufWriterSync(this._file);
  }
}
