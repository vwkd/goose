import { pathParse, pathJoin, pathFormat } from "https://deno.land/std@0.74.0/path/mod.ts"

export default function (config) {
    config.source = "src";
    config.target = "dst";
}