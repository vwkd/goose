# TODO

[TOC]



## In Progress

- how to conveniently set targetExtension?
- apply transformation in rendering step, and apply only to files with that extension, e.g. for markdown converter, `.md` can have layout `.html`, only `.md` is transformed
- what happens if user provided paths for files are directories, e.g. layoutPath, targetPath in template data or transform target path function, etc.
- make render function take single object argument, such that can use destructuring, future proof if later gives more arguments, e.g. pagination, collection, etc
- in template data make `.targetPath` and `.layoutPath()` take a function that is passed the data object, such that can use all data variables
  -> needs to separate `data` function from a `config` function such that can load `data` first, then execute `config` with merged data just before rendering, can let `data` function be also object like in global data file
- logging: log every error throw, add positional information
  needs to stringify error? otherwises will call `toString()` method...
  remove user identifying information from logs, e.g. printing file content
  how can get rid of uncaught error across module boundaries?
  wrap all user functions in try..catch blocks, e.g. render, imports, transformations, etc.
  log / error messages only relative paths to whatever makes sense, e.g. src, dst, _layout, make clear through text what it is
- async: what if script finishes earlier than unawaited promises and they throw an error?
  needs to await it at the most outer level, then catch any
- in template loop make sure all references are deleted, such that GC can clean up
  -> functional programming, don't mutate, only copy
- add types everywhere, everywhere undefined, disallow any
- more examples
  - markdown
  - transformations, e.g. syntax highlight, css autoprefixer
  - custom parsing of properties using global function and calling that property, e.g. `toDate(str)` as global property
  -> `import { parse as dateParse } from "https://deno.land/std@0.74.0/datetime/mod.ts";`



## Ideas

- multiple configs depending on environment variables, e.g. dev, prod
- maybe allow for multiple target path transformations, only useful if extensions have overlap via wildcard, e.g. .md -> .html, and .md -> *, but what is order?
- wildcards for extensions in transformations and target path transformations, e.g. `.md .html`, `.md *`, `* .html`, `* *`
  specific are executed first, then with single wildcard (wildcard in output first before wildcard in input?), then with both wildcards, maybe allow to configure...
- add hash to filename of assets but not .html files for cache invalidation
  -> difficult, because would need to parse content of all files and add everywhere where path is referenced, maybe leave this task to module bundlers or CDN directly...
  -> would need to loop over files list, transform output paths, loop over _all_ files and search through content where referenced, might be error prone if doesn't reference full path, e.g. in JS could reference like `import("my" + "path")`
- editor extension for syntax highlighting in template strings, e.g. markdown



## Long term

- parallelise
- incremental building
- use Deno's Permission APIs when stable to prompt for permission
- Collections: the set of template data objects of all template that have a specific "tag", available in the `render` function of any template, but doesn't contain only template data objects but also metadata of the file like paths, creation date, etc, the collection is sorted by creation date of the files but this can be customised by a user provided function in the config file, also special "all" collection of all templates no matter if have tag or not, and a way to exclude file from any collection, allow a template to not be outputted but still be used for collections
-> would need to load template data for all templates first before can do any rendering, fundamentally different than individual processing of each template like right now...
-> but if does, then could also throw an error if two outputted files have same targetPath
-> sort by file creation date, else by file name, e.g. date from `FileInfo.birthtime` from `Deno.lstat()`

```js
// template.html.js

export function data(config) {
  // add to one or more collections
  config.addCollection("posts", "javascript");

  // exclude from all collection
  config.addCollection(false);
}

export function render(data, template, collection) {
  // access data through collection[tag], e.g. collection.posts
}
```

```js
// .goose.js config file
export default function(config) {
  // func is called with array of collection as argument, expects another array as return value
  config.transformCollection("posts", func)
}
```

- Pagination: create multiple files for each item in a given set of data, set can be specified in the `data` function of a template, template is then executed for each item in the set, is available in the `render` function of the template, but should be able to paginate over any template data including global data as well, also items should be available in `data` function itself such that can use for example when setting `.targetPath`, also should be able to paginate over a collection to allow to create "tag" pages
-> could give an API to build function directly, arguments are a render function or path to a template file that exports one, a data object and a targetPath, then can call build as often as wants, can also create pages out of thin air without needing any template. BUT that would decouple content from files, instead wants a `post.html.js` that generates all post files...

```js
// template.html.js

export function data(config) {
  // enable pagination
  config.addPagination(["Lorem", "ipsum", "dolor"]);
}

export function render(data, template, collection, pagination) {
  // can access current item via pagination.item, e.g. "ipsum" depending on which file is generated
  // can also access index via pagination.index, e.g. 1
  // can access whole array using pagination.array, then get previous/next using pagination.array[pagination.index +- 1] etc. ?? OUT-OF-BOUNDS, BETTER PROVIDE READY MADE .before AND .after PROPERTIES
}
```