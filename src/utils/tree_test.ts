import { walkUp, walkUpWork, propMerge, propDeepMerge } from "./tree.ts";

function testWalk() {
    const a1 = {
        name: "a1"
    };

    const b1 = {
        name: "b1",
        parent: a1
    };

    const b2 = {
        name: "b2",
        parent: a1
    };

    const c1 = {
        name: "c1",
        parent: b1
    };

    const c2 = {
        name: "c2",
        parent: b1
    };

    // console.log(walkUp(a1, "parent"));
    // console.log(walkUp(b1, "parent"));
    // console.log(walkUp(b2, "parent"));
    // console.log(walkUp(c1, "parent"));
    console.log(walkUp(c2, "parent"));
    walkUpWork(c2, "parent", (node, lastValue) => `${node.name}${lastValue ? ` <- ${lastValue}` : ""}`, (node, lastValue) => {console.log(lastValue)});
}

testWalk();

// example data for property merging
// props have value of name of node for easier identification

function testPropMerge() {
    const a1 = {
        name: "a1",
        properties: {
            foo: "a1",
            bar: "a1",
            a1: "a1"
        }
    };

    const b1 = {
        name: "b1",
        parent: a1,
        properties: {
            foo: "b1",
            bar: "b1",
            b1: "b1"
        }
    };

    const b2 = {
        name: "b2",
        parent: a1,
        properties: {
            foo: "b2",
            bar: "b2",
            b2: "b2"
        }
    };

    const c1 = {
        name: "c1",
        parent: b1,
        properties: {
            foo: "c1",
            bar: "c1",
            c1: "c1",
        }
    };

    const c2 = {
        name: "c2",
        parent: b1,
        properties: {
            foo: "c2",
            bar: "c2",
            c2: "c2"
        }
    };

    // console.log(propMerge(a1, "parent"));
    // console.log(propMerge(b1, "parent"));
    // console.log(propMerge(b2, "parent"));
    // console.log(propMerge(c1, "parent"));
    console.log(propMerge(c2, "parent"));
}

testPropMerge();


function testPropDeepMerge() {
    const a1 = {
        name: "a1",
        properties: {
            foo: {
                a: "a1"
            },
            bar: "a1",
            a1: "a1"
        }
    };

    const b1 = {
        name: "b1",
        parent: a1,
        properties: {
            foo: {
                b: "b1"
            },
            bar: "b1",
            b1: "b1"
        }
    };

    const b2 = {
        name: "b2",
        parent: a1,
        properties: {
            foo: "b2",
            bar: "b2",
            b2: "b2"
        }
    };

    const c1 = {
        name: "c1",
        parent: b1,
        properties: {
            foo: "c1",
            bar: "c1",
            c1: "c1",
        }
    };

    const c2 = {
        name: "c2",
        parent: b1,
        properties: {
            foo: {
                c: "c2"
            },
            bar: "c2",
            c2: "c2"
        }
    };

    // console.log(propDeepMerge(a1, "parent"));
    // console.log(propDeepMerge(b1, "parent"));
    // console.log(propDeepMerge(b2, "parent"));
    // console.log(propDeepMerge(c1, "parent"));
    console.log(propDeepMerge(c2, "parent"));
}

testPropDeepMerge();