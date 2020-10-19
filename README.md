# Goose

A simple, fast and pluggable static site generator written in JavaScript for Deno. Inspired by Eleventy.

It uses pure JavaScript templates for maximum flexibility. You don't have to learn another template language.

It doesn't inject any JavaScript, styles, or markup into your files.



## Installation

```console
deno install --allow-read --allow-write --name=goose --no-check URL
```



## Run

```console
goose build -i "src" -o "dist" -c ".goose.js"
```

Default values are shown.

All paths are taken relative to the current working directory from which goose was invoked.

Note, quotes are only necessary if the path contains spaces.

To serve the output, you can use any off-the-shelve file server, e.g. [file_server](https://deno.land/std/http/file_server.ts) from Deno's standard library

```console
deno install --allow-net --allow-read https://deno.land/std@0.74.0/http/file_server.ts

file_server your/target/directory
```



## Config

You can pass the following command line flags

- `-i`, `--input`: source directory, e.g. `-i "src"`
- `-o`, `--output`: target directory, e.g. `-o "dst"`
- `-c`, `--config`: config path, e.g. `-c ".goose.js"`
- `-d`, `--dryrun`: dry run
- `-b`, `--verbose`: log more
- `-q`, `--quiet`: log less
- `-h`, `--help`: show help
- `-v`, `--version`: print version

For more configuration a `.goose.json` file can be used that can also set all of the above (except `config`). The path defaults to the current working directory, but can be changed using the `config` flag.



## Logging

You can enable logging with using environmental variables.

- `LOG_CONSOLE`: boolean, enable logging to console
- `LOG_FILE`: boolean, enable logging to console
- `LOG_PATH`: string, path to log file, has effect only if `LOG_FILE` is set
- `LOG_LEVEL`: ["trace", "debug", "info", "warn", "error", "critical"], lowest logging level shown, has effect only if `LOG_CONSOLE` and/or LOG_FILE are/is set

You can set them as environmental variables or create an `.env` file in the current working directory. Defaults are shown.

```text
LOG_CONSOLE = false
LOG_FILE = false
LOG_PATH = log.txt
LOG_LEVEL = info
```

Note, variable set in the `.env` file take priority over environmental variables.



## Issues

If you encounter any issues, please create an issue and attach a log file with log level `trace`.

The easiest way to do this is to create an `.env` file in the current working directory, for example

```text
LOG_FILE = true
LOG_PATH = log.txt
LOG_LEVEL = trace
```

Then rerun goose with the issue.