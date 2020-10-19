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

Templates are files that will be compiled to hypertext.

They can contain frontmatter and content. Frontmatter can be customised, see XYZ, 


Local properties

Special local properties are `layout` and `permalink`, which don't get added to the data object. `permalink` is the output path of the template path relative to the output directory. `layout` is the path relative to the layout directory of a single layout of the template.


## Layouts

Layouts are shells around templates. For example layouts can be used to build one header and footer accross all templates. Layouts reside in a top-level layout directory within the source directory, which defaults to `_layouts`. You can customise this using the `...???...` option.

Goose only supports JavaScript templates so you don't have to learn yet another template language. Also JavaScript templates are the most powerful because it's a complete programming language. A `.js` template must export a `render` function which takes a `template` object as argument which is the content of the template as a string, and a `data` property which is the deep merge of the template's data with all its layouts and the global data.

Layouts can also have frontmatter in the form of an exported `data` object. This object can contain itself a `layout` property with the path to another layout for chaining of layouts. Note, the path in `layout` is taken relative to the layouts directory, not the directory the current layout is in. For each template, the data is merged over its own local data, all layouts, and the global data. Note, layouts don't have a special `permalink` property because they won't be outputted.



## Incremental build

You can specify an incremental build using the `-i, --incremental` flag or `...???...` option.

On every build goose creates a dependency tree of the content hashes of the source files and saves it as a hidden file `.goose_tree.json` in the output directory. On the next build, if an incremental build is enabled and if such a file is found, goose only reprocesses the source files that changed their content hash or output path. It also tries to delete now invalid files in the target directory.

Note, goose doesn't check if the files in the target directory are actually there, and instead relies solely on the existence of the `.goose_tree.json`. This means that if `.goose_tree.json` is there, but the files are not, because maybe you deleted them, then it won't rebuild them. Conversely, if `.goose_tree.json` is missing, but the files are there, it will rebuild everything and overwrite the files.

Note also, goose doesn't delete files in the target directory that aren't referenced in `.goose_tree.json`. This means it never deletes files in the target directory that it didn't create. This can have unintended consequences, because if you renamed a folder in the target directory, an incremental build won't delete that, and you may have files on your site that you didn't expect. Therefore, if you want a clean incremental build, don't modify files in the target directory. And if you ever need a full build, don't use the incremental option, or make sure to delete the whole target directory, instead of just the files inside it, because you might miss the hidden `.goose_tree.json`.

## Eleventy

goose doesn't yet have the vast functionality of Eleventy, but we hope to add more over time. Currently missing:

- Pagination
- ...