import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Copy,
  GitBranch,
  Loader2,
  RotateCw,
  Send,
  TreePine,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TreeView, type TreeNode } from "@/components/TreeView";

export const Route = createFileRoute("/")({
  component: Index,
});

type Hierarchy = {
  type: "tree" | "cycle";
  root: string;
  depth?: number;
  size: number;
  tree?: TreeNode;
  cycleNodes?: string[];
};

type ApiResponse = {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string | null;
  hierarchies: Hierarchy[];
  invalid_entries: string[];
  duplicate_edges: string[];
};

const PLACEHOLDER = `A->B\nA->C\nB->D\nC->E`;

function Index() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const data = input
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (data.length === 0) {
      setError("Please enter at least one node relationship.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<ApiResponse>("/api/public/bfhl", { data });
      setResponse(res.data);
      toast.success("Hierarchy analyzed successfully");
    } catch (e) {
      const msg =
        axios.isAxiosError(e) && e.response?.data?.error
          ? e.response.data.error
          : "Failed to process request. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setResponse(null);
    setError(null);
  };

  const copyJson = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success("JSON copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-subtle)]">
      <Toaster />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 text-center"
        >
          <div
            className="mb-4 inline-flex items-center justify-center rounded-2xl p-3 shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <TreePine className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1
            className="bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Hierarchy Builder Dashboard
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Analyze node relationships and visualize tree structures
          </p>
        </motion.header>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-border/60 shadow-[var(--shadow-elegant)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="h-5 w-5 text-primary" />
                Node Relationships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER}
                rows={8}
                className="font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Separate entries with new lines or commas. Format:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">A-&gt;B</code>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={loading}
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              key="response"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 space-y-6"
            >
              {/* Top cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/60 shadow-[var(--shadow-soft)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      User Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <Row label="User ID" value={response.user_id} />
                    <Row label="Email" value={response.email_id} />
                    <Row label="Roll Number" value={response.college_roll_number} />
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-[var(--shadow-soft)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    <Stat label="Trees" value={response.total_trees} />
                    <Stat label="Cycles" value={response.total_cycles} />
                    <Stat
                      label="Largest Root"
                      value={response.largest_tree_root ?? "—"}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Hierarchies */}
              {response.hierarchies.length > 0 && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Hierarchies</h2>
                    <Button variant="ghost" size="sm" onClick={copyJson}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {response.hierarchies.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="h-full border-border/60 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elegant)]">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                Root:{" "}
                                <span className="font-mono text-primary">
                                  {h.root}
                                </span>
                              </CardTitle>
                              {h.type === "cycle" ? (
                                <Badge
                                  variant="destructive"
                                  className="gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Cycle Detected
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-accent text-accent-foreground"
                                >
                                  Depth {h.depth}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {h.type === "tree" && h.tree ? (
                              <div className="overflow-x-auto rounded-lg bg-muted/40 p-4">
                                <TreeView node={h.tree} />
                              </div>
                            ) : (
                              <div className="rounded-lg bg-destructive/5 p-4">
                                <p className="mb-2 text-xs font-medium text-destructive">
                                  Nodes involved:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {h.cycleNodes?.map((n) => (
                                    <Badge
                                      key={n}
                                      variant="outline"
                                      className="border-destructive/40 font-mono text-destructive"
                                    >
                                      {n}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Invalid */}
              {response.invalid_entries.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5 shadow-[var(--shadow-soft)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Invalid Entries ({response.invalid_entries.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {response.invalid_entries.map((e, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-destructive/40 bg-background font-mono text-destructive"
                      >
                        {e}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Duplicates */}
              {response.duplicate_edges.length > 0 && (
                <Card className="border-warning/40 bg-warning/5 shadow-[var(--shadow-soft)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      Duplicate Edges ({response.duplicate_edges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {response.duplicate_edges.map((e, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="border-warning/50 bg-background font-mono text-warning-foreground"
                      >
                        {e}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
