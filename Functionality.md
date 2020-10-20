# Functionality

[TOC]


<!-- todo: finish -->

## Introduction

This page explains how goose works in more detail. If you just want to see the available configurations, see [README](./README.md)



## Overview

<!-- 


layout / data directory: must be in top level of source folder, can use ignoredFilename
 -->

## Templates

Templates are files that will get outputted. This is a very general definition, but as we will see a very powerful one.

In goose, templates are written in JavaScript. This might seem weird at first, but it allows for ultimate flexibility as the templating language is a real programming language. You will never again miss any features that are only available in a full programming language. Also you don't have to learn yet another template language, because you already know JavaScript.

A template is any `.js` file in the source folder, that is not in in the layouts or data directory and also not ignored. It must export a `render` function that returns a string. It's entirely up to you how you assemble this string, you can use any computations you like and tap into the whole JavaScript ecosystem. Powerful!

Also goose doesn't make any assumptions about the file type of the template. A template doesn't need to be outputted in HTML, it could be anything else, including CSS and even JavaScript. It is entirely up to you what file a template should represent. Powerful!

Besides computing data on the fly, a template can also use "data properties" from an exported `data` object. For a isolated template this doesn't seem very useful, as you could just define these properties in the `render` function, but with become useful with chained layouts as we will see later.

In a template, a few data properties get special treatment. The `permalink` data property can customise the output path relative to the output directory as well as the file type by means of the extension. By default, the file type is `.html` and the output path is the same relative path in the target directory. The `layout` data property specifies the path of the layout relative to the layout directory. By default, no layout is used. Both special properties are still part of the data object.

A template doesn't need to be complete. It can use layouts to wrap itself. A template can chain onto exactly one layout by specifying the path in the `template` data property. This template chain can be as long as you like, except circular.

If things made sense until know, we can finally explain arguments of the `render` function. For a template, the first and only argument is the data object. However, instead of just the local `data` object, the `data` argument is actually the result of a deep merge with all `data` objects in the layout chain, as well as with the global data object. For a layout, the `render` function also receives as second argument the string from the output of the previous `render` function. Note, both arguments are copied, therefore manipulating them from inside the function doesn't have any effect, e.g. you can't change the output path by accessing `data.permalink` from within the `render` function.

<!-- todo: check if there are editor extensions to format languages inside template strings -->


## Layouts

Layouts are partial templates that a template can wrap itself in. Layouts themselves aren't outputted as their own files, but only as part of a template.

Layouts reside in a top-level layout directory within the source directory, which defaults to `_layouts`. You can customise this using the `...???...` option.

Layouts, similar to templates, can have "frontmatter" in the form of an exported `data` object. This object can contain itself a `layout` property with the path to another layout for chaining of layouts. Note, the path in `layout` is taken relative to the layouts directory, not the directory the current layout is in. For each template, on rendering the data is a deep merge of its own local data, the data of all layouts, and the global data. Data closer to the template overwrites any further away. Note, layouts don't have a special `permalink` property because they won't be outputted.



## Incremental build

You can specify an incremental build using the `-i, --incremental` flag or `...???...` option.

On every build goose creates a dependency tree of the content hashes of the source files and saves it as a hidden file `.goose_tree.json` in the output directory. On the next build, if an incremental build is enabled and if such a file is found, goose only reprocesses the source files that changed their content hash or output path. It also tries to delete now invalid files in the target directory.

Note, goose doesn't check if the files in the target directory are actually there, and instead relies solely on the existence of the `.goose_tree.json`. This means that if `.goose_tree.json` is there, but the files are not, because maybe you deleted them, then it won't rebuild them. Conversely, if `.goose_tree.json` is missing, but the files are there, it will rebuild everything and overwrite the files.

Note also, goose doesn't delete files in the target directory that aren't referenced in `.goose_tree.json`. This means it never deletes files in the target directory that it didn't create. This can have unintended consequences, because if you renamed a folder in the target directory, an incremental build won't delete that, and you may have files on your site that you didn't expect. Therefore, if you want a clean incremental build, don't modify files in the target directory. And if you ever need a full build, don't use the incremental option, or make sure to delete the whole target directory, instead of just the files inside it, because you might miss the hidden `.goose_tree.json`.

## Eleventy

goose doesn't yet have the vast functionality of Eleventy, but we hope to add more over time. Currently missing:

- Pagination
- ...