function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());
  return `${day}${month}${year}`;
}

function getBaseResponse() {
  return {
    user_id: `rahulparameswaran_${getFormattedDate()}`,
    email_id: process.env.EMAIL_ID || "your_email_here",
    college_roll_number:
      process.env.COLLEGE_ROLL_NUMBER || "your_roll_number",
  };
}

function validateEntries(data) {
  const validEdges = [];
  const invalidEntries = [];
  const pattern = /^([A-Z])->([A-Z])$/;

  const entries = Array.isArray(data) ? data : [];

  for (const entry of entries) {
    if (typeof entry !== "string") {
      invalidEntries.push(entry);
      continue;
    }

    const trimmed = entry.trim();

    if (!trimmed) {
      invalidEntries.push(entry);
      continue;
    }

    const match = trimmed.match(pattern);

    if (!match) {
      invalidEntries.push(entry);
      continue;
    }

    const parent = match[1];
    const child = match[2];

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    validEdges.push({
      parent,
      child,
      edge: `${parent}->${child}`,
    });
  }

  return { validEdges, invalidEntries };
}

function removeDuplicates(validEdges) {
  const uniqueEdges = [];
  const seen = new Set();
  const duplicateSet = new Set();

  for (const edge of validEdges) {
    if (seen.has(edge.edge)) {
      duplicateSet.add(edge.edge);
      continue;
    }

    seen.add(edge.edge);
    uniqueEdges.push(edge);
  }

  return {
    uniqueEdges,
    duplicateEdges: Array.from(duplicateSet).sort((a, b) => a.localeCompare(b)),
  };
}

function buildGraph(uniqueEdges) {
  const adjacency = new Map();
  const indegree = new Map();
  const undirected = new Map();
  const parentOf = new Map();
  const nodes = new Set();

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
    ensureNode(parent);
    ensureNode(child);

    const existingParent = parentOf.get(child);

    // Keep only first parent edge for each child.
    if (existingParent && existingParent !== parent) {
      continue;
    }

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

  const components = [];
  const visited = new Set();
  const sortedNodes = Array.from(nodes).sort((a, b) => a.localeCompare(b));

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

      const neighbors = Array.from(undirected.get(current) || []).sort((a, b) =>
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

  return { adjacency, indegree, components };
}

function detectCycles(graph) {
  const { adjacency, components } = graph;

  return components.map((component) => {
    const componentSet = new Set(component);
    const visited = new Set();
    const recursionStack = new Set();
    let hasCycle = false;

    const dfs = (node) => {
      if (hasCycle) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      const children = adjacency.get(node) || [];

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

    for (const node of component) {
      if (!visited.has(node)) {
        dfs(node);
      }
      if (hasCycle) {
        break;
      }
    }

    return hasCycle;
  });
}

function pickRoot(component, indegree) {
  const roots = component
    .filter((node) => (indegree.get(node) || 0) === 0)
    .sort((a, b) => a.localeCompare(b));

  if (roots.length > 0) {
    return roots[0];
  }

  return component.slice().sort((a, b) => a.localeCompare(b))[0];
}

function buildSubtree(node, adjacency) {
  const tree = {};
  const children = adjacency.get(node) || [];

  for (const child of children) {
    tree[child] = buildSubtree(child, adjacency);
  }

  return tree;
}

function buildHierarchies(graph, cycleStates) {
  const hierarchies = [];
  const { components, indegree, adjacency } = graph;

  for (let i = 0; i < components.length; i += 1) {
    const component = components[i].slice().sort((a, b) => a.localeCompare(b));
    const root = pickRoot(component, indegree);

    if (cycleStates[i]) {
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
      continue;
    }

    const tree = {
      [root]: buildSubtree(root, adjacency),
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

function calculateDepth(tree) {
  const rootKeys = Object.keys(tree);

  if (rootKeys.length === 0) {
    return 0;
  }

  const countDepth = (childrenObj) => {
    const keys = Object.keys(childrenObj);

    if (keys.length === 0) {
      return 1;
    }

    let maxDepth = 0;

    for (const key of keys) {
      maxDepth = Math.max(maxDepth, countDepth(childrenObj[key]));
    }

    return maxDepth + 1;
  };

  return countDepth(tree[rootKeys[0]]);
}

function buildSummary(hierarchies) {
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
    const depth = hierarchy.depth;

    if (depth > maxDepth) {
      maxDepth = depth;
      largestTreeRoot = hierarchy.root;
      continue;
    }

    if (depth === maxDepth && hierarchy.root.localeCompare(largestTreeRoot) < 0) {
      largestTreeRoot = hierarchy.root;
    }
  }

  return {
    total_trees: totalTrees,
    total_cycles: totalCycles,
    largest_tree_root: largestTreeRoot,
  };
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let payload = req && req.body ? req.body : {};

    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (_error) {
        payload = {};
      }
    }

    const data = Array.isArray(payload.data) ? payload.data : [];

    const { validEdges, invalidEntries } = validateEntries(data);
    const { uniqueEdges, duplicateEdges } = removeDuplicates(validEdges);
    const graph = buildGraph(uniqueEdges);
    const cycleStates = detectCycles(graph);

    const hierarchies = buildHierarchies(graph, cycleStates).map((entry) => {
      if (entry.has_cycle) {
        return entry;
      }

      return {
        ...entry,
        depth: calculateDepth(entry.tree),
      };
    });

    const response = {
      ...getBaseResponse(),
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: duplicateEdges,
      summary: buildSummary(hierarchies),
    };

    return res.status(200).json(response);
  } catch (_error) {
    const fallback = {
      ...getBaseResponse(),
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: "",
      },
    };

    return res.status(200).json(fallback);
  }
}
