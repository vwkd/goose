import { walkCall, deepMerge } from "./deps.ts";

// TODO: how gets the objects linked up in the first place ?
// TODO: really includes would be in data array, but can't specify nested computed properties...

type file = {
    hash: string;
    action: "process" | "copy" | "ignore";
    includes: object;
    data: object;
};

// use null for absence of include because will safe tree as JSON
function buildTree(fileList: file[]): object {
    const treeBranches = [];
    fileList.forEach(file => {
        if (file.action == "process") {
            const treeBranch = walkCall(file, "includes", (node, lastValue) => ({
                [node.hash]: lastValue ?? null
            }));
            treeBranches.push(treeBranch);
        } else if (file.action == "copy") {
            treeBranches.push({ [file.hash]: null });
        }
    });

    // TODO: Check that actually nothing is overwritten, since leafs are unique ?!?!
    const tree = treeBranches.reduce((pre, cur) => deepMerge(pre, cur), {});

    return tree;
}

function testBuildTree() {
    const a = {
        hash: "a",
        path: "L/A",
        action: "ignore",
        includes: null,
        data: {
            foo: "a",
            bar: "a"
        }
    };

    const b = {
        hash: "b",
        // path: "T/O/B",
        action: "ignore",
        includes: a,
        data: {
            foo: "b",
            bar: "b"
        }
    };

    const c1 = {
        hash: "c1",
        path: "F/O/C1",
        action: "process",
        includes: b,
        data: {
            foo: "c1",
            bar: "c1"
        }
    };

    const c2 = {
        hash: "c2",
        // path: "F/O/C2",
        action: "process",
        includes: b,
        data: {
            foo: "c2",
            bar: "c2"
        }
    };

    const fileList = [c2, c1, b, a];

    console.log(buildTree(fileList));
}

testBuildTree();