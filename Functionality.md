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

A template is any file in the source folder with a double extension that ends on `.*.js`, that is not in in the layouts or data directory and also not ignored. It doesn't need to be HTML, it could be anything else, including CSS and even JavaScript by giving it a `.js.js` extension. It is entirely up to you what file a template should represent. Powerful!

A template must export a `render` function that returns a string. It's entirely up to you how you assemble this string, you can use any computations you like and tap into the whole JavaScript ecosystem. Powerful!

Note, the double extension convention imposes a slight restriction on the filename of any `.js` file that is not a template, because if your `.js` filen contains dots in the filename it will be interpreted as a template. But as long as it's a template, you can use as many dots as you like in the filename, as only the last two are relevant, e.g. `some.file.html.js`. Note, a hidden `.js` file which doesn't contain more dots besides a leading dot is correctly interpreted as asset, e.g. `.hidden_file.js`.

Also goose doesn't make any assumptions about the file type of the template. By default, the outputted file has the second extension - as if the `.js` was stripped - but the outputted file could have an entirely different file type using permalinks, as we'll see in a moment.

Besides computing data on the fly, a template can also use "data properties" from an exported `data` object. For a isolated template this doesn't seem very useful, as you could just define these properties in the `render` function, but with become useful with chained layouts as we will see later.

In a template, a few data properties get special treatment. The `permalink` data property can customise the output path relative to the output directory as well as the file type by means of the extension. By default, the file type is `.html` and the output path is the same relative path in the target directory. The `layout` data property specifies the path of the layout relative to the layout directory. By default, no layout is used.

<!-- NO? YES? Both special properties are still part of the data object. -->

A template doesn't need to be complete. It can use layouts to wrap itself. A template can chain onto exactly one layout by specifying the path in the `template` data property. This template chain can be as long as you like, except circular.

If things made sense until know, we can finally explain arguments of the `render` function. For a template, the first and only argument is the data object. However, instead of just the local `data` object, the `data` argument is actually the result of a deep merge with all `data` objects in the layout chain, as well as with the global data object. For a layout, the `render` function also receives as second argument the string from the output of the previous `render` function. Note, both arguments are copied, therefore manipulating them from inside the function doesn't have any effect, e.g. you can't change the output path by accessing `data.permalink` from within the `render` function.

<!-- todo: check if there are editor extensions to format languages inside template strings -->


## Layouts

Layouts are partial templates that a template can wrap itself in. Layouts themselves aren't outputted as their own files, but only as part of a template. Note, because layouts aren't outputted, they can have a simple `.js` extension and there is no convention about a double extension.

<!-- ToDo: actually can be with any extension, is just read as JavaScript ?! -->

Layouts reside in a top-level layout directory within the source directory, which defaults to `_layouts`. You can customise this using the `...???...` option.

Layouts, similar to templates, can have "frontmatter" in the form of an exported `data` object. This object can contain itself a `layout` property with the path to another layout for chaining of layouts. Note, the path in `layout` is taken relative to the layouts directory, not the directory the current layout is in. For each template, on rendering the data is a deep merge of its own local data, the data of all layouts, and the global data. Data closer to the template overwrites any further away. Note, layouts don't have a special `permalink` property because they aren't outputted.

Note, a layout filename can actually be whatever you want, including with a "wrong" extension or no extension. As long as template that references it in the `layout` property provides the correct path, it's read in as JavaScript.



## Transformations

Transformations are functions that transform a rendered template. They are provided by the user in the configuration and can do any arbitrary transformation.

For example, goose doesn't handle Markdown any different than other files, but a transformation to HTML can be easily added using a transformation.

A transformation is a function that takes a string as input and returns another string as output.

Transformations can be added for a given input and output file type in the configuration. Multiple transformations can be added for the same file type, but just make sure to add them in the right order if the order they're executed in for a file matters.

For example, if you want to convert Markdown to HTML and minify it, then you could use

```javascript
.transformation(".md", ".html", markdown)
.transformation(".md", ".html", minify)
```

for some markdown parser and minifier.



## Incremental build

You can specify an incremental build using the `-i, --incremental` flag or `...???...` option.

On every build goose creates a dependency tree of the content hashes of the source files and saves it as a hidden file `.goose_tree.json` in the output directory. On the next build, if an incremental build is enabled and if such a file is found, goose only reprocesses the source files that changed their content hash or output path. It also tries to delete now invalid files in the target directory.

Note, goose doesn't check if the files in the target directory are actually there, and instead relies solely on the existence of the `.goose_tree.json`. This means that if `.goose_tree.json` is there, but the files are not, because maybe you deleted them, then it won't rebuild them. Conversely, if `.goose_tree.json` is missing, but the files are there, it will rebuild everything and overwrite the files.

Note also, goose doesn't delete files in the target directory that aren't referenced in `.goose_tree.json`. This means it never deletes files in the target directory that it didn't create. This can have unintended consequences, because if you renamed a folder in the target directory, an incremental build won't delete that, and you may have files on your site that you didn't expect. Therefore, if you want a clean incremental build, don't modify files in the target directory. And if you ever need a full build, don't use the incremental option, or make sure to delete the whole target directory, instead of just the files inside it, because you might miss the hidden `.goose_tree.json`.

## Eleventy

goose doesn't yet have the vast functionality of Eleventy, but we hope to add more over time. Currently missing:

- Pagination
- ...