import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { validateEntries } from "./utils/validate.js";
import { removeDuplicates, buildGraph } from "./utils/graph.js";
import { detectCycles } from "./utils/cycleDetection.js";
import { buildTrees } from "./utils/treeBuilder.js";
import { calculateDepth, generateSummary } from "./utils/depth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(bodyParser.urlencoded({ extended: true }));

function getFormattedDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear());

  return `${day}${month}${year}`;
}

function buildBaseResponse() {
  return {
    user_id: `rahulparameswaran_${getFormattedDate()}`,
    email_id: process.env.EMAIL_ID || "your_email_here",
    college_roll_number: process.env.COLLEGE_ROLL_NUMBER || "your_roll_number",
  };
}

function processHierarchyData(data) {
  const { validEdges, invalidEntries } = validateEntries(data);
  const { uniqueEdges, duplicateEdges } = removeDuplicates(validEdges);
  const graph = buildGraph(uniqueEdges);
  const cycleStates = detectCycles(graph);

  const hierarchies = buildTrees(graph, cycleStates).map((hierarchy) => {
    if (hierarchy.has_cycle) {
      return hierarchy;
    }

    return {
      ...hierarchy,
      depth: calculateDepth(hierarchy.tree),
    };
  });

  return {
    hierarchies,
    invalidEntries,
    duplicateEdges,
    summary: generateSummary(hierarchies),
  };
}

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.post("/bfhl", (req, res) => {
  try {
    const inputData = Array.isArray(req.body?.data) ? req.body.data : [];

    console.log("[POST /bfhl] Input:", inputData);

    const { hierarchies, invalidEntries, duplicateEdges, summary } =
      processHierarchyData(inputData);

    const response = {
      ...buildBaseResponse(),
      hierarchies,
      invalid_entries: invalidEntries,
      duplicate_edges: duplicateEdges,
      summary,
    };

    console.log("[POST /bfhl] Output summary:", summary);

    return res.status(200).json(response);
  } catch (error) {
    console.error("[POST /bfhl] Error:", error);

    return res.status(500).json({
      ...buildBaseResponse(),
      hierarchies: [],
      invalid_entries: [],
      duplicate_edges: [],
      summary: {
        total_trees: 0,
        total_cycles: 0,
        largest_tree_root: "",
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
