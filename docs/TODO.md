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