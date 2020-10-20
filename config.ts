
import { parse } from "./deps.ts";

const p = ".fd"
console.log(parse(p));

const config = {
    transforms: {
        ".html": [a => 3]
    }

    set transform(ext: string, func) {
        if (typeof ext != "string") {
            // todo: ignore, since ext must be string
        }
        if (ext.startsWith(".")) {
            // todo: ignore, ext not an ext because doesn't start with "."
        }
        if (ext.find(".")) {
            // todo: found another ".", is not an extension
        }
        //..., mayber just parse using path, rest will follow 
    };
}

// 