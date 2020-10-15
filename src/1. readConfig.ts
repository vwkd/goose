// first run

// global object
const goose = {};

/* basename quux.html
   dirname  asdf
   extname  .html !BEWARE: EMPTY IF NO EXTENSION, BETTER USE MEDIA TYPE?!
   join     /foo/bar/baz/asdf
   format <> parse  path string <> object
   normalize resolves `..` path segments
   relative(from, to) ../../impl/bbb
   resolves  join from right to left until has absolute path, most right path segment is cwd
*/

// load default config
// load `.goose.ts` from current folder
// load command line arguments

// load configuration
// - if command line flag passed, load file specified
// - otherwise `.goose.js` from current folder
// - else use defaults FROM SEPARATE FILE `defaults.js`
// - validate configuration, e.g. input != output folder
// - don't override command line flags

// global object
// - properties object (global)
// - files, array of file objects
// - config object

// set config property of global object



// TODO
// config for formatString to dateParse