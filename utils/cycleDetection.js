export function detectCycles(graph) {
  const { adjacency, components } = graph;

  return components.map((componentNodes) => {
    const componentSet = new Set(componentNodes);
    const visited = new Set();
    const recursionStack = new Set();
    let hasCycle = false;

    const dfs = (node) => {
      if (hasCycle) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const children = adjacency.get(node) ?? [];

      for (const child of children) {
        if (!componentSet.has(child)) {
          continue;
        }

        if (!visited.has(child)) {
          dfs(child);
        } else if (recursionStack.has(child)) {
          hasCycle = true;
          return;
        }
      }

      recursionStack.delete(node);
    };

    for (const node of componentNodes) {
      if (!visited.has(node)) {
        dfs(node);
      }

      if (hasCycle) {
        break;
      }
    }

    return {
      nodes: componentNodes,
      hasCycle,
    };
  });
}
