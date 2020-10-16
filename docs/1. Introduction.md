# Introduction

[TOC]



## Introduction

Goose can be seen as a compiler. It takes files from the source directory, processes them, and writes them to the output directory. Note that many input files can result in one output file, or vice versa, one input file can result in many output files. Any file of a transformed file type can have a frontmatter where it can declare properties, which it together with global properties can use in its body. The rest of the files is just copied over without touching it. Files that are ignored aren't touched at all.

By default no code is injected, no additional JavaScript, no styles, no markup. To show the ready made website, serve the output directory using any static file server, e.g. ?.


## Installation

install globally using `deno cache ...` and `deno install` ??
`deno install --allow-read --allow-write --allow-net --name=goose https://deno.land/x/goose/mod.ts`
can then be executed from anywhere using `goose`

Configuration file is `.goose.js`, expected to be in current folder from which invoked
can pass using command line flag

command line flags override any configuration


## Read files from source folder

source folder defaults to `src`, configurable `config.inputFolder("src/")`
ignore if folder begins with underscore, configurable, e.g. `config.inputIgnoreFolderName("_", ...)`
ignore if filename begins with underscore, configurable, e.g. `config.inputIgnoreFileName("_", ...)`
ignore if custom ignore rule, e.g. `config.inputIgnorePath("/path/to/file", ...)`

TODO:
can exclude filenames with leading symbol using **/[!_]*, but not multi-character, e.g. extension, also not folder name
better is opt-in because glob is inclusive filter, but wants to copy over all files except ignored ones
may be read complete directory list, then filter using regex on path, process the matches and pass through the rest

done using JS



## Read global data properties

global data folder defaults to `_data`, relative to source folder, configurable, e.g. `config.globalData("_data/")`
is not outputed, just for global data

properties can only be normal types, nothing fancy with getters / symbols, etc, otherwise won't be able to be deep merged

any compiled file has access to global and local properties
are deduplicated




## Parse frontmatter - read local properties

parsed as YAML, configurable, e.g. `config.frontmatterLanguage("YAML")`
`config.frontmatterSeparator("---")`

<!-- ToDo: throw error if non-valid -->
`layout`: single parent layout template, defaults to none
`date`: timestamp used for sorting, defaults to created date
`permalink`: path relative to output directory, defaults to current folder, only property that can contain other properties
`data`: custom properties, defaults to none

deep merged with properties of templates and global properties, closer to source overwrites further away
properties can only be normal types, nothing fancy with getters / symbols, etc, otherwise won't be able to be deep merged

done using gray-matter



## ?? Substitute variables

configurable, `config.variableTransform("data", data => {... return ...})`

done using JS



## Compile file

markdown to HTML, configurable, e.g. `config.parse({from: [".md", ".js"], to: ".html"}, {...})`

done using markdown-it



## Processing

configurable, `config.htmlTransform(...)`

done using JS



## Write files

output folder defaults to `dist`, configurable `config.outputFolder("dist/")`


done using JS