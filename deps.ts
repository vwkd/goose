export const meta = {
    name: "goose",
    version: "0.0.1"
};

// todo: exchange once #7293 is merged
// export * as log from "https://deno.land/std@0.74.0/log/mod.ts";
export { Logger, ConsoleHandler, FileHandler, LogLevelNames } from "./logging/mod.ts";

export { parse as cliParse } from "https://deno.land/std@0.74.0/flags/mod.ts";

export { config as dotenv } from "https://deno.land/x/dotenv@v0.5.0/mod.ts";

export { walk, exists, ensureDir, copy } from "https://deno.land/std@0.74.0/fs/mod.ts";

export {
    basename as pathBasename,
    sep as pathSeparator,
    dirname as pathDirname,
    extname as pathExtname,
    join as pathJoin,
    normalize as pathNormalize,
    format as pathFormat,
    parse as pathParse,
    relative as pathRelative,
    resolve as pathResolve
} from "https://deno.land/std@0.74.0/path/mod.ts";

// todo: pin version
export { deepMerge, deepMergeArr } from "https://raw.githubusercontent.com/vwkd/utilities-js/main/deep_merge.ts";
export { shallowMerge } from "https://raw.githubusercontent.com/vwkd/utilities-js/main/shallow_merge.ts";
export {
    walkChainCall,
    walkChainIdCall,
    walkChainMerge,
    walkChainIdMerge
} from "https://raw.githubusercontent.com/vwkd/utilities-js/main/walk_chain.ts";
export {
    walkTreeCall,
    walkTreeLeafCall,
    walkTreeCompare
} from "https://raw.githubusercontent.com/vwkd/utilities-js/main/walk_tree.ts";

// export { createHash } from "https://deno.land/std@0.74.0/hash/mod.ts";
// export { v4 as uuid } from "https://deno.land/std@0.74.0/uuid/mod.ts";