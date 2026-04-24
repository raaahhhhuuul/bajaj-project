function longestPathNodeCount(nodeChildren) {
  const childKeys = Object.keys(nodeChildren);

  if (childKeys.length === 0) {
    return 1;
  }

  let maxDepth = 0;

  for (const childKey of childKeys) {
    maxDepth = Math.max(maxDepth, longestPathNodeCount(nodeChildren[childKey]));
  }

  return maxDepth + 1;
}

export function calculateDepth(tree) {
  const roots = Object.keys(tree);

  if (roots.length === 0) {
    return 0;
  }

  const root = roots[0];
  return longestPathNodeCount(tree[root]);
}

export function generateSummary(hierarchies) {
  let totalTrees = 0;
  let totalCycles = 0;
  let largestTreeRoot = "";
  let maxDepth = -1;

  for (const hierarchy of hierarchies) {
    if (hierarchy.has_cycle) {
      totalCycles += 1;
      continue;
    }

    totalTrees += 1;
    const depth = hierarchy.depth ?? calculateDepth(hierarchy.tree);

    if (depth > maxDepth) {
      maxDepth = depth;
      largestTreeRoot = hierarchy.root;
      continue;
    }

    if (
      depth === maxDepth &&
      hierarchy.root.localeCompare(largestTreeRoot) < 0
    ) {
      largestTreeRoot = hierarchy.root;
    }
  }

  return {
    total_trees: totalTrees,
    total_cycles: totalCycles,
    largest_tree_root: largestTreeRoot,
  };
}
