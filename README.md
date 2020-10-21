# Goose

A simple, fast and pluggable static site generator written in JavaScript for Deno.

Inspired by Eleventy. This is very much early development, and still far from feature parity with any established SSG.



## Installation

```console
deno install --allow-read --allow-write --name=goose --no-check URL/mod.ts
```



## Run

```console
goose
```

To serve the output, you can use any off-the-shelve file server, e.g. [file_server](https://deno.land/std/http/file_server.ts) from Deno's standard library

```console
deno install --allow-net --allow-read https://deno.land/std@0.74.0/http/file_server.ts

file_server your/target/directory
```



## Flags

You can pass the following command line flags

- `-c`, `--config`: config path, defaults to `".goose.js"`
- `-d`, `--dryrun`: dry run
<!-- - `-b`, `--verbose`: log more
- `-q`, `--quiet`: log less -->
- `-h`, `--help`: show help
- `-v`, `--version`: print version

Note, the config path is taken relative to the current working directory from which goose was invoked. Also quotes are only strictly necessary if the path contains spaces.



## Config

You can configure goose by creating a `.js` file that has a function as default export that takes a `config` object as argument. If no config flag is provided, goose looks by default for a `.goose.js` file in the current working directory.

The following properties can be set on the `config` argument. Note, you can also read the properties at any time and they reflect the currently set value.

- `.sourcePath`: source directory path relative to cwd, string, defaults to `src`
- `.targetPath`: target directory path relative to cwd, string, defaults to `dst`
- `.ignoredFilename`: any file whose name starts with it is ignored, string, defaults to `_`
- `.ignoredDirname`: any file which has an ancestor directory whose name starts with it is ignored, string, defaults to `_`
- `.layoutDirname`: layout directory name see [layouts](), string, defaults to `_layout`
- `.dataDirname`: data directory name see [global data](), string, defaults to `_data`
- `.mergeFunction`: merge function for template data, function, defaults to [`deepMergeArr`]()
<!-- - `.incrementalBuild`: incremental build, boolean, defaults to `false` -->

Note, the layout and data directory must reside in the top-level of the source directory, therefore `layoutDirname` and `dataDirname` specify only the name and not the path. Note, `ignoredDirname` doesn't apply to the layout and data directory name, such that you may use `ignoredDirname` in `dataDirname` and `layoutDirname`. However, inside the layout and data directory the `.ignoredFilename` and `.ignoredDirectory` apply as normal.

The following methods can be called on the `config` argument.

- `.getTransformations(sourceExt, targetExt)`: read all transformations for templates with given source and target extensions, returns array or `undefined` if no transformations have been set yet
- `.setTransformations(sourceExt, targetExt, func1, ..., funcN)`: sets transformations for templates with given source and target extensions, defaults to none
- `.getTargetPathTransformation(sourceExt, targetExt)`: read the target path tranformation for templates with given source and target extensions, returns the function or `undefined` if no transformation has been set yet
- `.setTargetPathTransformation(sourceExt, targetExt, func)`: set the target path tranformation for templates with given source and target extensions, defaults to none

Note, the extensions must be strings with a leading dot, e.g. `".html"`, otherwise the transformations will be ignored as goose won't find them later.

Note, calling `.setTransformations()` multiple times just adds more transformations without overwriting any previous. Transformations for a given pair of extensions are executed in the order they were added. Note, for `.setTargetPathTransformation()` only one transform can be set for a given pair of extensions and calling it multiple times overwrites the previously set transform.



## Logging

Logging can be enabled using the following environmental variables.

- `LOG_CONSOLE`: logging to console, boolean, defaults to `false`
- `LOG_FILE`: logging to file, boolean, defaults to `false`
- `LOG_PATH`: path to log file, has effect only if `LOG_FILE` is set, string, defaults to `"log.txt"`
- `LOG_LEVEL`: lowest recorded logging level, has effect only if `LOG_CONSOLE` and/or `LOG_FILE` is set, [`"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"critical"`], defaults to `"info"`

For convenience, these can also be set using an `.env` file in the current working directory. For example, for the defaults the `.env` file would contain the following.

```text
LOG_CONSOLE = false
LOG_FILE = false
LOG_PATH = log.txt
LOG_LEVEL = info
```

Note, a variable set in the `.env` file takes priority over one set as environmental variable.



## Issues

If you report an non-obvious issue, please attach a log file with log level `"trace"`.

The easiest way to do this is to create an `.env` file in the current working directory with the following contents

```text
LOG_FILE = true
LOG_PATH = log.txt
LOG_LEVEL = trace
```

Then rerun goose, open the newly created `log.txt`, and copy the contents into the issue.