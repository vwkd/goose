import { deepMerge } from "../deps.ts";

// todo: pass in function as argument to do some work for every node
export function walkUp(startNode, linkName) {
    function recursion(node) {
        return node[linkName] ? `${recursion(node[linkName])} <- ${node.name}` : node.name;
    }
    return recursion(startNode);
}

/**
 * Walks up chain of linked nodes
 * @param startNode - node from which to start walking
 * @param linkName - property name that contains the linked node
 * @param callbackEach - function executed for each node, is passed the current node and the return value of the previous callbackEach
 * @param callbackRoot - function executed for root node only, is passed the root node and the return value of the previous callbackEach
 */
export function walkUpWork<L extends string, T extends {L: T}>(
    startNode: T,
    linkName: L,
    callbackEach: (node: T, lastValue: any) => any,
    callbackRoot: (node: T, lastValue: any) => any
): void {
    function recursion(node, lastValue) {
        const returnValue = callbackEach(node, lastValue);
        if (node[linkName]) {
            recursion(node[linkName], returnValue);
        } else {
            callbackRoot(node, returnValue);
        }
    }
    recursion(startNode, undefined);
}

export function propMerge(startNode, linkName) {
    function recursion(node) {
        const localProps = node.properties;
        return node.linkName ? Object.assign(recursion(node.linkName), localProps) : localProps;
    }

    return recursion(startNode);
}

export function propDeepMerge(startNode, linkName) {
    function recursion(node) {
        const localProps = node.properties;
        return node.linkName ? deepMerge(recursion(node.linkName), localProps) : localProps;
    }

    return recursion(startNode);
}
