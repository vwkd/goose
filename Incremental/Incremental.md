Note: primitive incremental build
doesn't check if change had actually any effect, just looks at content hash, recomputes if that changed, no matter if it was only a pointless whitespace addition or not...

note: does not rely on file paths, i.e. can move assets into different directories, layout files and templates probably not because they have their relationship hardcoded in their content which then would need to change
--> PROBLEM: because changed templates might rely on new path of assets
            also unchanged template files that got moved wouldn't show up at the new target path relative to the new source path...
--> needs to copy to new location if targetPath changed but content hash didn't change !!!

--- build new tree

add hash to file objects in file list

for each template, build dependency chain of layoutPath relationship
record hash for file in chain
deep merge into one dependency tree
(FEAT: includes all referenced layouts, but not layouts that are unreferenced)

for each asset, record hash into linear "tree" (array)

--- compare new and old tree

build dependency tree difference for creation from source

```js
walkTreeCompare(newTree, oldTree, flagMustReprocess, false)
```

if any global data file changed, recompute global data, otherwise reuse
  easier than to keep track of which global data actually overwrote which
process these templates and layouts only, i.e. load data, render template


build dependency tree difference for deletion in target

if any global data file changed, flag every template for deletion

```js
walkTreeCompare(oldTree, newTree, flagMustDelete, true)
```

if any template/layout in tree changed, all templates below must be deleted