import { log } from "./deps";

export async function work(...args) {

// Read files from source folder

log.debug("CWD:", Deno.cwd());

// Read global properties


// Parse frontmatter - read local properties

// ?? Substitute variables


// Compile file

// Processing


// Write files




}


// const fs = require('fs');
// const {join, basename, dirname, extname, relative} = require('path');

// const {compile} = require('yeahjs');
// const fm = require('front-matter');
// const marked = require('marked');
// const yaml = require('js-yaml');

const defaultOptions = {
    source: "./source/",
    target: "./build",
    format: [".md", ".html"],
    config: "./.goose.js",
    dryrun: false,
    verbose: false,
    quiet: false,
}  

function goose(options = {}) {
    // overrides defaultOptions if options are available
    options = Object.assign({}, defaultOptions, options);

    // check if source exists, fail if not

    // check if dest exists, fail if yes, won't overwrite!

    // read source, fail if not possible
    // - read only metadata, not all in memory

    // for each file: process
    // - if path is not ignored, and suffix is processed, process
    // - else if path is not ignored, and suffix is not processed, copy passthrough
    // - else if path is ignored, discard
    // await Promise.all[]

    // create dest, fail if not possible or already exists (in meantime)

    // write files
    
    const proto = {};
    const root = createCtx('.'); // root data object
    proto.root = root; // add data root access to all leaf nodes

    const templates = [];
    const cache = {}; // include cache

    fs.mkdirSync(dest, {recursive: true}); // make sure destination exists

    walk(src, root); // process files, collect data and templates to render

    // render templates; we do it later to make sure all data is collected first
    for (const {ejs, path, data, dir, name, ext, isCollection} of templates) {
        if (isCollection) {
            for (const key of Object.keys(data)) {
                render(ejs, path, data[key], dir, key, ext);
            }
        } else {
            render(ejs, path, data, dir, name, ext);
        }
    }

    function render(ejs, filename, data, dir, name, ext) {
        const path = join(dir, name) + ext;
        const template = compile(ejs, {
            locals: Object.keys(data).concat(['root', 'rootPath']),
            filename, read, resolve, cache
        });
        log(`render  ${path}`);
        fs.writeFileSync(join(dest, path), template(data));
    }

    function resolve(parent, filename) {
        return join(dirname(parent), filename);
    }

    function read(filename) {
        return fs.readFileSync(filename, 'utf8');
    }

    // create an object to be used as evalulation data in a template
    function createCtx(rootPath, properties) {
        // prototype magic to make sure all data objects have access to root/rootPath
        // in templates and includes without them being enumerable
        const ctx = Object.create(proto, {rootPath: {value: rootPath, enumerable: false}});
        if (properties) Object.assign(ctx, properties);
        return ctx;
    }

    // recursively walk through and process files inside the source directory
    function walk(dir, data) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const path = join(dir, file);
            if (relative(path, dest) === '') continue;

            const shortPath = relative(src, path);
            const ext = extname(path);
            const name = basename(path, ext);
            const rootPath = relative(dirname(shortPath), '');
            const destPath = join(dest, shortPath);

            if (file[0] === '.' || file === 'node_modules' || ext === '.lock' || name.endsWith('-lock')) {
                log(`skip    ${shortPath}`);
                continue;
            }

            const stats = fs.lstatSync(path);

            if (stats.isDirectory()) {
                fs.mkdirSync(destPath, {recursive: true});
                data[file] = createCtx(join(rootPath, '..'));
                walk(path, data[file]);
                continue;
            }

            if (ext === '.md') {
                log(`read    ${shortPath}`);
                const {attributes, body} = fm(fs.readFileSync(path, 'utf8'));

                if (attributes.body !== undefined)
                    throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

                data[name] = createCtx(rootPath, {...attributes, body: marked(body, markedOptions)});

            } else if (ext === '.yml' || ext === '.yaml') {
                log(`read    ${shortPath}`);
                data[name] = createCtx(rootPath, yaml.safeLoad(fs.readFileSync(path, 'utf8')));

            } else if (ext === '.ejs') {
                if (name[0] === '_') { // skip includes
                    log(`skip    ${shortPath}`);
                    continue;
                }
                log(`compile ${shortPath}`);
                templates.push({
                    data,
                    name,
                    path,
                    ejs: fs.readFileSync(path, 'utf8'),
                    isCollection: name === 'item',
                    dir: dirname(shortPath),
                    ext: extname(name) ? '' : '.html'
                });

            } else if (path !== destPath) {
                log(`copy    ${shortPath}`);
                fs.copyFileSync(path, destPath);
            }
        }
    }
}