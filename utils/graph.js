export function removeDuplicates(validEdges) {
  const seenEdges = new Set();
  const duplicateEdgeSet = new Set();
  const uniqueEdges = [];

  for (const edge of validEdges) {
    if (seenEdges.has(edge.edge)) {
      duplicateEdgeSet.add(edge.edge);
      continue;
    }

    seenEdges.add(edge.edge);
    uniqueEdges.push(edge);
  }

  return {
    uniqueEdges,
    duplicateEdges: [...duplicateEdgeSet].sort((a, b) => a.localeCompare(b)),
  };
}

function getConnectedComponents(nodes, undirectedGraph) {
  const visited = new Set();
  const components = [];
  const sortedNodes = [...nodes].sort((a, b) => a.localeCompare(b));

  for (const node of sortedNodes) {
    if (visited.has(node)) {
      continue;
    }

    const stack = [node];
    const component = [];
    visited.add(node);

    while (stack.length > 0) {
      const current = stack.pop();
      component.push(current);

      const neighbors = [...(undirectedGraph.get(current) ?? [])].sort((a, b) =>
        a.localeCompare(b),
      );

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          stack.push(neighbor);
        }
      }
    }

    component.sort((a, b) => a.localeCompare(b));
    components.push(component);
  }

  return components;
}

export function buildGraph(uniqueEdges) {
  const adjacency = new Map();
  const indegree = new Map();
  const parentOf = new Map();
  const nodes = new Set();
  const undirected = new Map();

  const ensureNode = (node) => {
    if (!adjacency.has(node)) {
      adjacency.set(node, []);
    }

    if (!indegree.has(node)) {
      indegree.set(node, 0);
    }

    if (!undirected.has(node)) {
      undirected.set(node, new Set());
    }

    nodes.add(node);
  };

  for (const { parent, child } of uniqueEdges) {
    const existingParent = parentOf.get(child);

    // Keep only the first parent assignment for each child.
    if (existingParent && existingParent !== parent) {
      continue;
    }

    ensureNode(parent);
    ensureNode(child);

    parentOf.set(child, parent);
    indegree.set(child, 1);

    adjacency.get(parent).push(child);
    undirected.get(parent).add(child);
    undirected.get(child).add(parent);
  }

  for (const [node, children] of adjacency.entries()) {
    children.sort((a, b) => a.localeCompare(b));
    adjacency.set(node, children);
  }

  const components = getConnectedComponents(nodes, undirected);

  return {
    adjacency,
    indegree,
    nodes,
    components,
  };
}
