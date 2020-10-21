# TODO

[TOC]



## Near term

- *. -> .html templates who aren't named "index" must go into subfolder with that name and itself is named "index.html"...
  needs a global targetPathTransformation for templates, like transformations but not multiple only one, used if template doesn't set own targetPath, e.g. a template with name.* -> name.html has its targetPath transformed to /name/index.html
- add logging to code, every error throw log.error() etc.
  needs to stringify error? otherwises will call `toString()` method...
  remove user identifying information from logs, e.g. printing file content
  how can get rid of uncaught error across module boundaries?
  wrap all user functions in try..catch blocks, e.g. render, imports, transformations, etc.
- what if script finishes earlier than unawaited promises and they throw an error?
  needs to await it at the most outer level, then catch any
- find all paths, e.g. in error messages, and normalise, e.g. with src directory, relative to what...
- in template loop make sure all references are deleted, such that GC can clean up
  -> functional programming, don't mutate, only copy

- where is sorting used? sort by file creation date, else by file name
  e.g. date from `FileInfo.birthtime` from `Deno.lstat()`
- allow properties in permalink property
- allow custom sorting besides date property
- duration timing
- debugging
- multiple configs depending on environment variables, e.g. dev, prod

## Desired features

- add hash to filename of static files ???
- wildcards for transformations, e.g. `.md .html`, `.md *`, `* .html`, `* *`
  specific are executed first, then with single wildcard (wildcard in output first before wildcard in input?), then with both wildcards, maybe allow to configure...

## Long term

- parallelise
- incremental building
- use Deno's Permission APIs when stable
- editor extension for content in template strings, e.g. markdown

## Questions

CLI options
// -f, --format         processed file types ??NEEDED?? ?? Would also need to parse as array where string has spaces
// -p, --pathprefix     url template filter directory ?? NEEDED??

## Examples

- plugins via transformations
e.g. syntax highlight, css autoprefixer
- custom parsing of properties using global function and calling that property, e.g. `toDate(str)` as global property