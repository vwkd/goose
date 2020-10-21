import { pathParse, pathJoin, pathFormat } from "./deps.ts"

export default function (config) {
    config.source = "examples/simple/src/";
    config.target = "examples/simple/dst/";

    config.setTargetPathTransformation(".html", ".html", indexHTML)
}

function indexHTML(path) {
    // ext is ".html" since that's what transform is registered on, but use variable for consistency
    const {dir, name, ext} = pathParse(path);

    // don't do anything if name is already "index"
    if (name == "index") {
        return path;
    }
    
    // otherwise put in subfolder with its original name and name it "index" instead
    else {
        return pathFormat({dir: pathJoin(dir, name), name: "index", ext: ext})
    }
}