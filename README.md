# Goose

A simple, fast and extendable static site generator for Deno. Inspired by Eleventy.

It uses pure JavaScript templates for maximum flexibility. You don't have to learn another template language.



## Installation

```bash
deno install --allow-read --allow-write --allow-net --name=goose --no-check URL
```



## Run

```bash
goose build -i "src" -o "dist" -c ".goose.js"
```

Default values are shown.

All paths are taken relative to the current working directory from which goose was invoked.

Note, quotes are only necessary if the path contains spaces.