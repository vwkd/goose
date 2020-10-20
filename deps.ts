
export const meta = {
    name: "goose",
    version: "0.0.1"
};

// todo: exchange once #7293 is merged
// export * as log from "https://deno.land/std@0.74.0/log/mod.ts";
export {
    Logger,
    ConsoleHandler,
    FileHandler,
    LogLevelNames
} from "./logging/mod.ts";

export { parse as minimist } from "https://deno.land/std@0.74.0/flags/mod.ts";

export { config as dotenv } from "https://deno.land/x/dotenv@v0.5.0/mod.ts";

// todo: expandGlob
export { walk, exists, ensureDir, copy } from "https://deno.land/std@0.74.0/fs/mod.ts";

export {
    basename,
    sep,
    dirname,
    extname,
    join,
    normalize,
    parse,
    relative,
    resolve
} from "https://deno.land/std@0.74.0/path/mod.ts";

export { createHash } from "https://deno.land/std@0.74.0/hash/mod.ts";


// todo: pin version
export { deepMerge } from "https://raw.githubusercontent.com/vwkd/utilities-js/main/deep_merge.ts";
export { shallowMerge } from "https://raw.githubusercontent.com/vwkd/utilities-js/main/shallow_merge.ts";
export {
    walkChainCall,
    walkChainIdCall,
    walkChainMerge,
    walkChainIdMerge
} from "https://raw.githubusercontent.com/vwkd/utilities-js/main/walk_chain.ts";
export { walkTreeCall,  walkTreeLeafCall, walkTreeCompare
} from "https://raw.githubusercontent.com/vwkd/utilities-js/main/walk_tree.ts";

// export { v4 as uuid } from "https://deno.land/std@0.74.0/uuid/mod.ts";
// export { parse as dateParse } from "https://deno.land/std@0.74.0/datetime/mod.ts";
// export { valivar } from "https://deno.land/x/valivar@v6.2.9/mod.ts";

// export { default as graymatter } from 'https://cdn.skypack.dev/gray-matter';
// export { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts"
// export { parse as yamlParse } from "https://deno.land/std@0.74.0/encoding/yaml.ts";
