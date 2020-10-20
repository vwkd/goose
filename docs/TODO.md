# TODO

[TOC]


## Terminology

source, target, template

## Near term

- add logging to code, every error throw log.error() etc.
  needs to stringify error? otherwises will call `toString()` method...
  remove user identifying information from logs, e.g. printing file content
  how can get rid of uncaught error across module boundaries?
  wrap all user functions in try..catch blocks, e.g. render, imports, transformations, etc.
- what if script finishes earlier than unawaited promises and they throw an error?
  needs to await it at the most outer level, then catch any
- find all paths, e.g. in error messages, and normalise, e.g. with src directory, relative to what...

- where is sorting used? sort by date, else by file name
- allow properties in permalink property
- allow custom sorting besides date property
- duration timing
- debugging
- serve via file_server ?, watch via Deno --watch ?
- multiple configs depending on environment variables, e.g. dev, prod
- allow custom parsing of properties, e.g. as date, etc.

## Desired features

- plugins, e.g. syntax highlight, render KaTeX
  js (lint, bundle), css (autoprefixer)
- add hash to filename of static files ???
- template in `*.js`, can prefix with different extension to make that filetype, e.g. `*.css.js` becomes `*.css` 

## Long term

- parallelise
- incremental building
- use Deno's Permission APIs when stable

## Questions

CLI options
// -f, --format         processed file types ??NEEDED?? ?? Would also need to parse as array where string has spaces
// -p, --pathprefix     url template filter directory ?? NEEDED??

What about markdown? Write inside template string as well?