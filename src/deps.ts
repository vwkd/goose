export const meta = { name: "goose", version: "0.0.1" };

export { parse as cliParse } from "https://deno.land/std@0.74.0/flags/mod.ts";

// todo: use correct log levels, for quiet and verbose, customise output
export * as log from "https://deno.land/std@0.74.0/log/mod.ts";

export { parse as dateParse } from "https://deno.land/std@0.74.0/datetime/mod.ts";

export { v4 as uuid } from "https://deno.land/std@0.74.0/uuid/mod.ts";

// todo: more
export { expandGlob, walk, exists } from "https://deno.land/std@0.74.0/fs/mod.ts";

export { basename,
    delimiter,
    dirname,
    extname,
    join,
    normalize,
    parse,
    relative,
    resolve, } from "https://deno.land/std@0.74.0/path/mod.ts";

// todo: tmp
// export { work as goose } from "./work.ts";

// export { valivar } from "https://deno.land/x/valivar@v6.2.9/mod.ts";

// todo: fix
export { deepMerge } from "https://raw.githubusercontent.com/vwkd/utilities-js/main/deep_merge.ts"