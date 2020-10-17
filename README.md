# Goose

A simple, fast and extendable static site generator for Deno. Inspired by Eleventy.

It uses pure JavaScript templates for maximum flexibility. You don't have to learn another template language.



## Installation

```bash
deno install --allow-read --allow-write --allow-net --name=goose --no-check URL
```



## Run

```bash
goose build -i "src" -o "dist" -c ".goose.js"
```

Default values are shown.

All paths are taken relative to the current working directory from which goose was invoked.

Note, quotes are only necessary if the path contains spaces.



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



## Logging

You can enable logging with using environmental variables.

- `LOG_CONSOLE`: boolean, enable logging to console
- `LOG_FILE`: boolean, enable logging to console
- `LOG_PATH`: string, path to log file, has effect only if `LOG_FILE` is set
- `LOG_LEVEL`: ["Trace", "Debug", "Info", "Warn", "Error", "Critical"], lowest logging level shown, has effect only if `LOG_CONSOLE` and/or LOG_FILE are/is set

You can set them as environmental variables or create an `.env` file in the current working directory. Defaults are shown.

```text
LOG_CONSOLE = false
LOG_FILE = false
LOG_PATH = log.txt
LOG_LEVEL = "Info"
```

Note, variable set in the `.env` file take priority over environmental variables.