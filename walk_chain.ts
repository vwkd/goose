// ToDo: computed property name in TypeScript? Because linkName, mergeProperty, idName aren't correct, actual value is only known at runtime... Probably not possible?!
type Node = {
    linkName: Node;
    [index: string]: unknown;
};

type Prop = {
    [index: string]: unknown;
};

type NodeMerge = {
    linkName: NodeMerge;
    mergeProperty: Prop;
    [index: string]: unknown;
};

type NodeId = {
    linkName: string;
    idName: string;
    [index: string]: unknown;
};

type NodeIdMerge = {
    linkName: string;
    idName: string;
    mergeProperty: Prop;
    [index: string]: unknown;
};

/**
 * Walks along chain of linked nodes.
 * For each node executes a callback function.
 * @param startNode node from which to start walking
 * @param linkName property name that contains the linked node
 * @param callback function executed for each node, is passed the current node and the return value of the previous callback
 * @returns return value of last callback
 */
export function walkChainCall<U extends unknown>({
    startNode,
    linkName,
    callback
}: {
    startNode: Node;
    linkName: string;
    callback: (node: Node, lastValue: U) => U;
}): U {
    function recursion(node, lastValue, visitedNodes) {
        visitedNodes.push(node);

        const returnValue = callback(node, lastValue);
        const nextNode = node[linkName];

        // found a cyclical dependency, exit
        if (visitedNodes.includes(nextNode)) {
            return returnValue;
        }

        return nextNode ? recursion(nextNode, returnValue, visitedNodes) : returnValue;
    }
    return recursion(startNode, undefined, []);
}

/**
 * Walks along chain of linked nodes.
 * Merges the specified property over all linked nodes, earlier from start node overwrite later towards root node.
 * @param startNode node from which to start walking
 * @param linkName property name that contains the linked node
 * @param mergeProperty property name that is merged
 * @param mergeFunction function that merges two properties, e.g. shallowMerge, deepMerge, etc.
 * @returns copy of the merged property, doesn't mutate nodes
 */
export function walkChainMerge({
    startNode,
    linkName,
    mergeProperty,
    mergeFunction
}: {
    startNode: NodeMerge;
    linkName: string;
    mergeProperty: string;
    mergeFunction: (nodeOne: Prop, nodeTwo: Prop) => Prop;
}): Prop {
    function recursion(node, visitedNodes) {
        visitedNodes.push(node);

        const localProperty = node[mergeProperty];
        const nextNode = node[linkName];

        // found a cyclical dependency, exit
        if (visitedNodes.includes(nextNode)) {
            return localProperty;
        }

        return nextNode ? mergeFunction(recursion(nextNode, visitedNodes), localProperty) : localProperty;
    }

    return recursion(startNode, []);
}

/**
 * Walks along chain of linked nodes.
 * For each node executes a callback function.
 * @param startNode node from which to start walking
 * @param nodeList list in which to search for the linked node
 * @param linkName property name that contains ID of linked node
 * @param idName property name that contains ID of a node
 * @param callback function executed for each node, is passed the current node and the return value of the previous callback
 * @param data object passed to every callback function
 * @returns return value of last callback
 * Note: the value of `idName` of nodes in the `nodeList` is assumed to be unique.
 */
export function walkChainIdCall<U extends unknown>({
    startNode,
    nodeList,
    linkName,
    idName,
    callback,
    data
}: {
    startNode: NodeId;
    nodeList: NodeId[];
    linkName: string;
    idName: string;
    callback: (node: NodeId, lastValue: U, data: object) => U;
    data: object
}): U {
    function recursion(node, lastValue, visitedNodes, data) {
        visitedNodes.push(node);
        
        const returnValue = callback(node, lastValue, data);
        
        // otherwise find() will return the next node without an idName
        if (node[linkName] == undefined) {
            return returnValue;
        }
        
        // can choose first match because value of idName of nodes in nodeList is unique
        const nextNode = nodeList.find(nd => nd[idName] == node[linkName]);

        // found a cyclical dependency, exit
        if (visitedNodes.includes(nextNode)) {
            return returnValue;
        }

        return nextNode ? recursion(nextNode, returnValue, visitedNodes, data) : returnValue;
    }

    return recursion(startNode, undefined, [], data);
}

/**
 * Walks along chain of linked nodes.
 * Merges the specified property over all linked nodes, earlier from start node overwrite later towards root node.
 * @param startNode node from which to start walking
 * @param nodeList list in which to search for the linked node
 * @param linkName property name that contains ID of linked node
 * @param idName property name that contains ID of a node
 * @param mergeProperty property name that is merged
 * @param mergeFunction function that merges two properties, e.g. shallowMerge, deepMerge, etc.
 * @returns copy of the merged property, doesn't mutate nodes
 * Note: the value of `idName` of nodes in the `nodeList` is assumed to be unique.
 */
export function walkChainIdMerge({
    startNode,
    nodeList,
    linkName,
    idName,
    mergeProperty,
    mergeFunction
}: {
    startNode: NodeIdMerge;
    nodeList: NodeIdMerge[];
    linkName: string;
    idName: string;
    mergeProperty: string;
    mergeFunction: (nodeOne: Prop, nodeTwo: Prop) => Prop;
}): Prop {


    function recursion(node, visitedNodes) {
        visitedNodes.push(node);

        const localProperty = node[mergeProperty];

        // otherwise find() will return the next node without an idName
        if (node[linkName] == undefined) {
            return localProperty;
        }

        // can choose first match because value of idName of nodes in nodeList is unique
        const nextNode = nodeList.find(nd => nd[idName] == node[linkName]);

        // found a cyclical dependency, exit
        if (visitedNodes.includes(nextNode)) {
            return localProperty;
        }

        return nextNode ? mergeFunction(recursion(nextNode, visitedNodes), localProperty) : localProperty;
    }

    return recursion(startNode, []);
}
