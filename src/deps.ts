export const meta = { name: "goose", version: "0.0.1" };

export { parse as cliParse } from "https://deno.land/std@0.74.0/flags/mod.ts";

// todo: configure using quiet and verbose
export * as log from "https://deno.land/std@0.74.0/log/mod.ts";

export { parse as dateParse } from "https://deno.land/std@0.74.0/datetime/mod.ts";

export { v4 as uuid } from "https://deno.land/std@0.74.0/uuid/mod.ts";

// todo: more
export { expandGlob, walk, exists } from "https://deno.land/std@0.74.0/fs/mod.ts";

// todo: tmp
export { work as goose } from "./work.ts";

export { valivar } from "https://deno.land/x/valivar@v6.2.9/mod.ts";
