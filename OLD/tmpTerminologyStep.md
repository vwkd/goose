terminology

- template: content that is not complete, relies on layouts, is outputted
- layouts: content that is not complete, wraps templates, is not outputted

- property: variable available in template
  local, if from frontmatter
  global, if from data directory

- render: assemble a template and its layout(s) only applies to templates
- transform (compile): md to html, svelte to html, etc.
- transform (transpile): html to minified html, etc. applies to all files

- action: copy+render, copy only, ignore

BUILD

1. check permissions, existence
   allow existence of target if incremental, else not
2. read all file infos into list
3. (add hashes to all files) INCREMENTAL
4. add action to all files depending on path / filename
  `_data/**/*`, `_include/**/*`, `_*.*` => ignore
  `**/*{.md,.html}` => render
  rest => copy
  --> separate in top-level object
7. (execute global data folder into global data object)
8. ([action=render] read frontmatter into local data object)
9. validate all outputted files (i.e. [action!=ignore]?), e.g. no two identical outputPath, only single includes, that includes exist, that two layouts have no cyclical includes
paths don't contain `../`!!
10. [action=render] build dependency tree from includes relationship by hash
(NOTE: includes relationship is relative to _includes)
11. [action=copy] build hash array as well
12. build hash to path map
13. (incremental) build
14. save new tree to .goose_tree.json in output dir
    needs to save also outputPath for deletion, and sourcePath for change of source folder structure

BUILD_ASSET

1. Transform (transpile)
2. write to outputPath

BUILD_PAGE

1. Transform (compile) without props
2. Render
  2.1 Merge properties over all layouts and global data
  2.2 call render with merged properties
3. Transform (transpile)
4. write to outputPath

BUILD_INCREMENTAL

1. if old HASH_TREE & HASH_ARRAY exists
2. for each node in old tree from top to bottom
3. if hash not in new tree, invalidate all bottom leafs in old tree
4. find paths for invalid old nodes
5. delete files of invalid nodes, delete parent directory if not empty and if not target directory
(don't error if not found, only warn, e.g. if user deleted all files except hidden HASH_TREE file)
6. for each node in new tree from top to bottom
7. if hash not in old tree, flag all bottom in new tree for reprocessing
8. reread properties of all flagged intermediary nodes (layouts)
9. rebuild all flagged leafs (templates) with BUILD_PAGE
?10. for each node in new/old tree from top to bottom
?11. if outputPath of new node is different that outputPath of node with same hash in old tree, flag node to be moved
(BEWARE: this is only relevant if source folder structure changes, because if permalink changes changes content and therefore hash)
?12. find paths for moved nodes
?13. move node in output dir
---
9. for each item in old array
10. if hash not in new array, flag for deletion
11. find paths for invalid items
12. delete files of invalid items, delete parent directory if not empty and if not target directory
13. for each item in new array
14. if hash not in old array, flag for reprocessing
12. reprocess all flagged items with BUILD_ASSET

TODO: could nodes move around in tree??
TODO: could repurpose existing files in reprocessing of new tree??
BEWARE: relies on old .goose_tree, doesn't check if files are actually there!!!

BUILD_COMPLETE

1. for each copy file BUILD_ASSET
2. for each render file BUILD_PAGE