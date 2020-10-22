import { walkChainCall, deepMerge } from "./deps.ts";

// TODO: how gets the objects linked up in the first place ?
//      maybe needs new walkCall that instead of following direct links looks up keys in an array, e.g. by path in fileList
// TODO: check if include exists
// TODO: really includes would be in data array, but can't specify nested computed properties...
// TODO: circular dependency check

type file = {
    hash: string;
    action: "process" | "copy" | "ignore";
    includes: object;
    data: object;
};

// only for files that have file.action == "process" !!!
function buildBranch(file) {
    const treeBranch = walkChainCall(file, "includes", (node, lastValue) => ({
        [node.hash]: lastValue ?? null
    }));
    return treeBranch
}

// use null for absence of include because will safe tree as JSON
function buildTree(fileList: file[]): object {
    
    const treeBranches = fileList.map(buildBranch);

    // TODO: Check that actually nothing is overwritten, since leafs are unique ?!?!
    const tree = treeBranches.reduce((pre, cur) => deepMerge(pre, cur), {});

    return tree;
}

function dependencyList(fileList: file[]) {

    const processTree = buildTree(fileList.filter(file => file.action == "process"));

    // todo: rename, is not a tree
    const copyTree = fileList.filter(file => file.action == "copy").map(file => ({ [file.hash]: null }));

    console.log("build the following trees:")
    console.log(processTree);
    console.log(copyTree);

    return {"processTree": processTree, "copyTree": copyTree};
}

function testBuildTree() {
    const a = {
        hash: "a",
        action: "ignore",
        includes: null,
        data: {
            foo: "a",
            bar: "a"
        }
    };

    const b = {
        hash: "b",
        action: "ignore",
        includes: a,
        data: {
            foo: "b",
            bar: "b"
        }
    };

    const c1 = {
        hash: "c1",
        action: "process",
        includes: b,
        data: {
            foo: "c1",
            bar: "c1"
        }
    };

    const c2 = {
        hash: "c2",
        action: "process",
        includes: b,
        data: {
            foo: "c2",
            bar: "c2"
        }
    };

    const z1 = {
        hash: "z1",
        action: "copy",
    }

    const fileList = [z1, c2, c1, b, a];

    console.log(dependencyList(fileList));
}

testBuildTree();