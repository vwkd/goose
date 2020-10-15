import { deepMerge } from "./deps.ts";

// todo: argument of exported function
const linkKey = "template";

function walkUp(node) {
    return node.linkKey ? `${walkUp(node.linkKey)} <- ${node.name}` : node.name;
}

function propMerge(node) {
    const localProps = node.properties;
    return node.linkKey ? Object.assign(propMerge(node.linkKey), localProps) : localProps;
}

function propDeepMerge(node) {
    const localProps = node.properties;
    return node.linkKey ? deepMerge(propDeepMerge(node.linkKey), localProps) : localProps;
}

// example data for walking

function testWalk() {
    const a1 = {
        name: "a1"
    };

    const b1 = {
        name: "b1",
        linkKey: a1
    };

    const b2 = {
        name: "b2",
        linkKey: a1
    };

    const c1 = {
        name: "c1",
        linkKey: b1
    };

    const c2 = {
        name: "c2",
        linkKey: b1
    };

    console.log(walkUp(a1));
    console.log(walkUp(b1));
    console.log(walkUp(b2));
    console.log(walkUp(c1));
    console.log(walkUp(c2));
}

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
        linkKey: a1,
        properties: {
            foo: "b1",
            bar: "b1",
            b1: "b1"
        }
    };

    const b2 = {
        name: "b2",
        linkKey: a1,
        properties: {
            foo: "b2",
            bar: "b2",
            b2: "b2"
        }
    };

    const c1 = {
        name: "c1",
        linkKey: b1,
        properties: {
            foo: "c1",
            bar: "c1",
            c1: "c1",
        }
    };

    const c2 = {
        name: "c2",
        linkKey: b1,
        properties: {
            foo: "c2",
            bar: "c2",
            c2: "c2"
        }
    };

    // console.log(propMerge(a1));
    // console.log(propMerge(b1));
    // console.log(propMerge(b2));
    // console.log(propMerge(c1));
    console.log(walkUp(c2));
    console.log(propMerge(c2));
    console.log(propDeepMerge(c2));
}



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
        linkKey: a1,
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
        linkKey: a1,
        properties: {
            foo: "b2",
            bar: "b2",
            b2: "b2"
        }
    };

    const c1 = {
        name: "c1",
        linkKey: b1,
        properties: {
            foo: "c1",
            bar: "c1",
            c1: "c1",
        }
    };

    const c2 = {
        name: "c2",
        linkKey: b1,
        properties: {
            foo: {
                c: "c2"
            },
            bar: "c2",
            c2: "c2"
        }
    };

    console.log(walkUp(c2));
    console.log(propDeepMerge(c2));
}

testPropDeepMerge()