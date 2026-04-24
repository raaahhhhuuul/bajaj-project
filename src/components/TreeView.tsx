import { motion } from "framer-motion";

export type TreeNode = {
  name: string;
  children: TreeNode[];
};

interface TreeViewProps {
  node: TreeNode;
  isLast?: boolean;
  prefix?: string;
  depth?: number;
}

export function TreeView({ node, isLast = true, prefix = "", depth = 0 }: TreeViewProps) {
  const connector = depth === 0 ? "" : isLast ? "└── " : "├── ";
  const childPrefix = depth === 0 ? "" : prefix + (isLast ? "    " : "│   ");

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: depth * 0.04 }}
      className="font-mono text-sm leading-relaxed"
    >
      <div className="flex">
        <span className="whitespace-pre text-muted-foreground select-none">
          {prefix}
          {connector}
        </span>
        <span
          className={
            depth === 0
              ? "font-semibold text-primary"
              : "text-foreground"
          }
        >
          {node.name}
        </span>
      </div>
      {node.children.map((child, idx) => (
        <TreeView
          key={`${child.name}-${idx}`}
          node={child}
          isLast={idx === node.children.length - 1}
          prefix={childPrefix}
          depth={depth + 1}
        />
      ))}
    </motion.div>
  );
}
