# TODO

[TOC]


## Terminology

source, target, template

## Near term

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
- use different argument parser: customisable help menu, shows default values and types, doesn't need command to specify multiple options, aliases for options, etc.
e.g. -d, -v, -q take no value, -i, -o, -c, etc. take a string
print help when invalid value instead of error

## Questions

CLI options
// -f, --format         processed file types ??NEEDED?? ?? Would also need to parse as array where string has spaces
// -p, --pathprefix     url template filter directory ?? NEEDED??
