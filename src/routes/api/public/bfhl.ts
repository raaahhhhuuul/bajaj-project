import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Force-load module augmentation for `server` route option
void createServerFn;

const BodySchema = z.object({
  data: z.array(z.string()).max(2000),
});

type TreeNode = {
  name: string;
  children: TreeNode[];
};

type Hierarchy = {
  type: "tree" | "cycle";
  root: string;
  depth?: number;
  size: number;
  tree?: TreeNode;
  cycleNodes?: string[];
};

function buildHierarchies(edges: Array<[string, string]>) {
  const childrenMap = new Map<string, Set<string>>();
  const parents = new Map<string, Set<string>>();
  const nodes = new Set<string>();

  for (const [a, b] of edges) {
    nodes.add(a);
    nodes.add(b);
    if (!childrenMap.has(a)) childrenMap.set(a, new Set());
    childrenMap.get(a)!.add(b);
    if (!parents.has(b)) parents.set(b, new Set());
    parents.get(b)!.add(a);
  }

  // Find connected components (undirected) using union-find
  const parentUF = new Map<string, string>();
  const find = (x: string): string => {
    if (!parentUF.has(x)) parentUF.set(x, x);
    if (parentUF.get(x) === x) return x;
    const r = find(parentUF.get(x)!);
    parentUF.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parentUF.set(ra, rb);
  };
  for (const [a, b] of edges) union(a, b);

  const components = new Map<string, Set<string>>();
  for (const n of nodes) {
    const r = find(n);
    if (!components.has(r)) components.set(r, new Set());
    components.get(r)!.add(n);
  }

  const hierarchies: Hierarchy[] = [];

  for (const comp of components.values()) {
    // Detect cycle in this component using DFS on directed graph
    const compNodes = Array.from(comp);
    let hasCycle = false;
    const cycleNodes: string[] = [];
    const color = new Map<string, number>(); // 0 white, 1 gray, 2 black
    for (const n of compNodes) color.set(n, 0);

    const dfs = (u: string) => {
      color.set(u, 1);
      for (const v of childrenMap.get(u) ?? []) {
        if (color.get(v) === 1) {
          hasCycle = true;
          return;
        }
        if (color.get(v) === 0) {
          dfs(v);
          if (hasCycle) return;
        }
      }
      color.set(u, 2);
    };
    for (const n of compNodes) {
      if (color.get(n) === 0) {
        dfs(n);
        if (hasCycle) break;
      }
    }

    if (hasCycle) {
      hierarchies.push({
        type: "cycle",
        root: compNodes[0],
        size: compNodes.length,
        cycleNodes: compNodes.sort(),
      });
      continue;
    }

    // Find root: node with no parent within component
    const roots = compNodes.filter((n) => !parents.has(n) || parents.get(n)!.size === 0);
    const rootName = roots[0] ?? compNodes[0];

    const buildTree = (name: string, visited: Set<string>): TreeNode => {
      visited.add(name);
      const kids = Array.from(childrenMap.get(name) ?? [])
        .filter((c) => !visited.has(c))
        .sort();
      return {
        name,
        children: kids.map((c) => buildTree(c, new Set(visited))),
      };
    };

    const tree = buildTree(rootName, new Set());
    const computeDepth = (n: TreeNode): number =>
      n.children.length === 0 ? 1 : 1 + Math.max(...n.children.map(computeDepth));

    hierarchies.push({
      type: "tree",
      root: rootName,
      depth: computeDepth(tree),
      size: compNodes.length,
      tree,
    });
  }

  return hierarchies;
}

export const Route = createFileRoute("/api/public/bfhl")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const json = await request.json();
          const parsed = BodySchema.safeParse(json);
          if (!parsed.success) {
            return new Response(
              JSON.stringify({ error: "Invalid request body" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const raw = parsed.data.data;
          const invalidEntries: string[] = [];
          const seen = new Set<string>();
          const duplicateEdges: string[] = [];
          const edges: Array<[string, string]> = [];

          for (const entry of raw) {
            const cleaned = entry.trim();
            if (!cleaned) continue;
            const match = cleaned.match(/^([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)$/);
            if (!match) {
              invalidEntries.push(entry);
              continue;
            }
            const [, a, b] = match;
            if (a === b) {
              invalidEntries.push(entry);
              continue;
            }
            const key = `${a}->${b}`;
            if (seen.has(key)) {
              duplicateEdges.push(key);
              continue;
            }
            seen.add(key);
            edges.push([a, b]);
          }

          const hierarchies = buildHierarchies(edges);
          const trees = hierarchies.filter((h) => h.type === "tree");
          const cycles = hierarchies.filter((h) => h.type === "cycle");
          const largest = trees.reduce<Hierarchy | null>(
            (acc, h) => (!acc || h.size > acc.size ? h : acc),
            null,
          );

          return new Response(
            JSON.stringify({
              user_id: "raaahhhhuuul",
              email_id: "rahultester@example.com",
              college_roll_number: "RA2311028020045",
              total_trees: trees.length,
              total_cycles: cycles.length,
              largest_tree_root: largest?.root ?? null,
              hierarchies,
              invalid_entries: invalidEntries,
              duplicate_edges: duplicateEdges,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          return new Response(
            JSON.stringify({ error: "Server error", detail: (e as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
