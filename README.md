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



## Flags

You can pass the following command line flags

<!-- - `-i`, `--input`: source directory, e.g. `-i "src"`
- `-o`, `--output`: target directory, e.g. `-o "dst"` -->
- `-c`, `--config`: config path relative to cwd, e.g. `-c ".goose.js"`
- `-d`, `--dryrun`: dry run
- `-b`, `--verbose`: log more
- `-q`, `--quiet`: log less
- `-h`, `--help`: show help
- `-v`, `--version`: print version

<!-- todo: can't guarantee since config is loaded before source & target are known -->
Note, the config path may not be inside the source or the target directory.



## Config

<!-- todo: find better name for function and argument -->
You can configure goose by creating a `.js` file that exports a `config` function that takes a `config` object as argument. If no config flag is provided, goose looks by default for a `.goose.js` file in the current working directory.

The following properties can be set on the config object. Note, you can read the properties as well to see what the defaults are.

- `.source`: source directory path relative to cwd, string, defaults to `src`
- `.target`: target directory path relative to cwd, string, defaults to `dst`
- `.ignoredFilename`: any file whose name starts with it is ignored, string, defaults to `_`
- `.ignoredDirname`: any directory whose name starts with it is ignored, string, defaults to `_`
- `.dataDirname`: data directory name see [global data](), string, defaults to `_data`
- `.layoutDirname`: data directory name see [layouts](), string, defaults to `_layout`

Note, `dataDirname` and `layoutDirname` must reside in the top-level of the source directory, therefore only the name and not the path needs to be specified.

Note, `ignoredDirname` is evaluated later than `dataDirname` and `layoutDirname`, such that these can use `ignoredDirname` in their name. However, `ignoredFilename` and `ignoredDirname` still applies inside them just like anywhere else.

The following methods can be called on the config object.

- `.transformation(inputExt, outputExt, func)`: transformation for a template that has extension `inputExt` in the source directory and `outputExt` in the output directory using the function `func`, defaults to none

<!-- todo: allow for wildcards, are executed after more specific transformations, wildcard in output is executed before wildcard in input ?? better allow to configure...
.md .html e.g. compile
.md *     e.g. 
* .html   e.g. minify
 -->

Note, the transformations for template of a given pair of `inputExt` / `outputExt` are executed in the order they are added. If the order of your transformations matter, make sure to add them in the right order, e.g. first Markdown to HTML, then minify HTML.



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