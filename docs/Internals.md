# Internals

[TOC]



## Introduction

<!-- Todo: sketch flow -->

### `mod.ts`

Entry point, parses CLI flags, loads config through `config.ts` and builds files through `build.ts`.

### `config.ts`

Loads config from config file if available, else provides default config.

### `build.ts`

Validates directories, loads files, copies assets, loads global data, loads layouts, loads templates, processes templates, writes templates


## Templates and Layouts

All layouts are read into memory, because assumes has few layouts and many templates for a given layout. Templates are only read one after the other into memory.

<!-- todo: check that above is implemented correctly, no references to template that would prevent it from being GC -->


## Paths

Paths aren't validated except that they are a string, non-empty and non-whitespace only, 
and do not contain `..` to not escape the current working directory. Because legal characters may vary by platform it's easier to just try to read/write and throw an error if it fails.

<!-- todo: check that above is implemented for all paths: configPath from argument, paths from config file, paths from data properties, etc. -->