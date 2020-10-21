# Functionality

[TOC]


<!-- todo: finish -->

## Introduction

This page explains how goose works in more detail. If you just want to see the available configurations, see [README](./README.md)


It uses pure JavaScript templates for maximum flexibility. You don't have to learn another template language.

It doesn't inject any JavaScript, styles, or markup into your files.


## Overview

<!-- 
only templates and assets are outputted, layouts and data not,
templates are processed / rendered, assets are copied over unmodified
note: everything unrecognised is treated as asset and copied, not ignored! doesn't by default ignore unrecognised files!

 -->

## Templates

Templates are files that will get outputted. This is a very general definition, but as we will see a very powerful one.

In goose, templates are written in JavaScript. This might seem weird at first, but it allows for ultimate flexibility as the templating language is a real programming language. You will never again miss any features that are only available in a full programming language. Also you don't have to learn yet another template language, because you already know JavaScript.

A template is any file in the source folder with a double extension that ends on `.*.js`, that is not in in the layouts or data directory and also not ignored. It doesn't need to be HTML, it could be anything else, including CSS and even JavaScript by giving it a `.js.js` extension. It is entirely up to you what file a template should represent. Powerful!

A template must export a `render` function that returns a string. It's entirely up to you how you assemble this string, you can use any computations you like and tap into the whole JavaScript ecosystem. Powerful! Note, the render function can not be async (unlike a global data export function).

Note, the double extension convention imposes a slight restriction on the filename of any `.js` file that is not a template, because if your `.js` filen contains dots in the filename it will be interpreted as a template. But as long as it's a template, you can use as many dots as you like in the filename, as only the last two are relevant, e.g. `some.file.html.js`. Note, a hidden `.js` file which doesn't contain more dots besides a leading dot is correctly interpreted as asset, e.g. `.hidden_file.js`.

Also goose doesn't make any assumptions about the file type of the template. By default, the outputted file has the second extension - as if the `.js` was stripped - but the outputted file could have an entirely different file type using targetPaths, as we'll see in a moment.

Besides computing data on the fly, a template can also use "data properties" from an exported `data` object. For a isolated template this doesn't seem very useful, as you could just define these properties in the `render` function, but with become useful with chained layouts as we will see later.

In a template, a few data properties get special treatment. The `targetPath` data property can customise the output path relative to the output directory as well as the file type by means of the extension. By default, the file type is `.html` and the output path is the same relative path in the target directory. The `layoutPath` data property specifies the path of the layout relative to the layout directory. By default, no layout is used.

<!-- todo: special properties are now set using methods on a `settings` object passed as argument to the `data` function, return value is reused untransformed as data -->

<!-- NO? YES? Both special properties are still part of the data object. -->

A template doesn't need to be complete. It can use layouts to wrap itself. A template can chain onto exactly one layout by specifying the path in the `template` data property. This template chain can be as long as you like, except circular.

If things made sense until know, we can finally explain arguments of the `render` function. For a template, the first and only argument is the data object. However, instead of just the local `data` object, the `data` argument is actually the result of a deep merge with all `data` objects in the layout chain, as well as with the global data object. For a layout, the `render` function also receives as second argument the string from the output of the previous `render` function. Note, both arguments are copied, therefore manipulating them from inside the function doesn't have any effect, e.g. you can't change the output path by accessing `data.targetPath` from within the `render` function.

<!-- todo: check if there are editor extensions to format languages inside template strings -->


## Layouts

Layouts are partial templates that a template can wrap itself in. Layouts themselves aren't outputted as their own files, but only as part of a template. Note, because layouts aren't outputted, they can have a simple `.js` extension and there is no convention about a double extension.

<!-- ToDo: actually can be with any extension, is just read as JavaScript ?! -->

Layouts reside in a top-level layout directory within the source directory, which defaults to `_layouts`. You can customise this using the `...???...` option.

Layouts, similar to templates, can have "frontmatter" in the form of an exported `data` object. This object can contain itself a `layoutPath` property with the path to another layout for chaining of layouts. Note, the path in `layoutPath` is taken relative to the layouts directory, not the directory the current layout is in. For each template, on rendering the data is a deep merge of its own local data, the data of all layouts, and the global data. Data closer to the template overwrites any further away. Note, layouts don't have a special `targetPath` property because they aren't outputted.

Note, a layout filename can actually be whatever you want, including with a "wrong" extension or no extension. As long as template that references it in the `layoutPath` property provides the correct path, it's read in as JavaScript.



## Template data

<!-- todo: use template data, subset is global data -->
<!-- todo: finish  -->

A template can have frontmatter in form of an exported `data` object, whose properties are available in the `render` function. Each layout can do the same thing, because it's just a special template. But to be useful, the data available in the `render` function is not the one of the invidual template, but the merge of all the layouts that it's chained to. The merge function can be configured, but by default is a deep merge. Note, if you use a custom merge function, it should be capable of taking arbitrarily many arguments, otherwise it will work correctly only for ???templates whose layout chain consists of a single layout and???NO,CHANGED not more than two global data files.

<!-- todo: insert global data file  -->

And to be even more useful, you can create global data files whose data is available in all templates.

goose itself makes no restrictions on the type of data you can put in the `data` object or the default export in case of a global data file. However, since they are all merged, not all data types make much sense. For example, in deep merge two arrays get merged by concatenation, while in shallow merge not. But objects (including functions) never get merged with any primitive value (including arrays). Therefore for data that you want to merge, it's advisable to use objects.

---

Global data files are simple `.js` files that have a default export. The value of their default export is deep merged into a global data object. For each template, the global data object is then deep merged with the data of the template and all its layouts at rendering. This allows for global data that is available in every template and layout.

Note, global data has the "lowest priority" in the data chain. This means, an export of any other value type than a (function returning an) object will probably be overwritten, because primitive values don't merge. Note, arrays do merge with each other, but arrays and objects won't. Therefore if you want your data to merge, you should use objects.

Note, the first deep merge is that of any global data files themselves by the order the directory is walked using Deno's [std/fs/walk.ts](https://deno.land/std/fs/walk.ts). The order may not be intuitive, so make sure that the data of the global data files doesn't overwrite each other already.

Only the default export of the global data file is used, and any other export is ignored. If the export is a function, it will be called and it's return value will be used instead. Note, the function can be async (unlike a template `render` function). The function is called without any arguments.

---

The data exported from template, layout and global data files is not touched by goose and just passed through to the mergeFunction. You must make sure that whatever data you return merges well with the mergeFunction. For simple data types like object literals and arrays this should be well behaved, but more complex data types like functions might require a closer look on the mergeFunction.


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

- filters: can use global data to export a function which can then call from every template / layout, e.g. parse a date string as date
- template data: `permalink` is `targetPath`, `layout` is `layoutPath`