function pickRoot(componentNodes, indegree) {
  const roots = componentNodes
    .filter((node) => (indegree.get(node) ?? 0) === 0)
    .sort((a, b) => a.localeCompare(b));

  if (roots.length > 0) {
    return roots[0];
  }

  return [...componentNodes].sort((a, b) => a.localeCompare(b))[0];
}

function buildSubTree(node, adjacency) {
  const children = adjacency.get(node) ?? [];
  const branch = {};

  for (const child of children) {
    branch[child] = buildSubTree(child, adjacency);
  }

  return branch;
}

export function buildTrees(graph, cycleStates) {
  const { adjacency, indegree, components } = graph;
  const hierarchies = [];

  for (let index = 0; index < components.length; index += 1) {
    const componentNodes = [...components[index]].sort((a, b) =>
      a.localeCompare(b),
    );
    const root = pickRoot(componentNodes, indegree);
    const hasCycle = Boolean(cycleStates[index]?.hasCycle);

    if (hasCycle) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const tree = {
      [root]: buildSubTree(root, adjacency),
    };

    hierarchies.push({
      root,
      tree,
      has_cycle: false,
    });
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  return hierarchies;
}
