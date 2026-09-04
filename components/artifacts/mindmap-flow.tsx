"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  type Node,
  type Edge,
  BackgroundVariant,
  Handle,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface RawNode {
  id: string;
  label: string;
}

interface RawEdge {
  id?: string;
  source: string;
  target: string;
}

interface MindmapFlowProps {
  nodes: RawNode[];
  edges: RawEdge[];
}

/**
 * Custom node renderer for mind map topics.
 * Differentiates styling based on depth (root, depth 1, depth 2+).
 */
function MindmapNode({
  data,
  selected,
}: {
  data: {
    label: string;
    depth: number;
    childCount?: number;
    isDimmed: boolean;
  };
  selected?: boolean;
}) {
  const { depth, isDimmed } = data;
  const isRoot = depth === 0;
  const isLevel1 = depth === 1;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-2.5 shadow-sm transition-all duration-300",
        isDimmed && "opacity-30 blur-[0.5px]",
        selected &&
          !isDimmed &&
          "ring-primary ring-offset-background ring-2 ring-offset-2",
        isRoot
          ? "bg-primary text-primary-foreground rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-md"
          : isLevel1
            ? "border-primary/30 border-l-primary/60 bg-card text-foreground hover:border-primary/50 rounded-xl border border-l-2 px-4 py-2 text-xs font-medium"
            : "border-border/50 bg-card/60 text-muted-foreground hover:border-border/80 rounded-lg border px-3 py-1.5 text-xs",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!border-background !bg-primary/80 !size-2.5 !border-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span className="max-w-[220px] truncate leading-snug">{data.label}</span>
      {data.childCount && data.childCount > 0 ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            isRoot
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {data.childCount}
        </span>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!border-background !bg-primary/80 !size-2.5 !border-2 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

const nodeTypes = {
  mindmapNode: MindmapNode,
};

function getLayoutedElements(rawNodes: RawNode[], rawEdges: RawEdge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    ranksep: 110,
    nodesep: 35,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Find root nodes (no incoming edges)
  const targetNodeIds = new Set(rawEdges.map((e) => e.target));
  const rootNodeIds = new Set(
    rawNodes.filter((n) => !targetNodeIds.has(n.id)).map((n) => n.id),
  );
  if (rootNodeIds.size === 0 && rawNodes.length > 0) {
    rootNodeIds.add(rawNodes[0].id);
  }

  // Calculate depths via BFS
  const depths = new Map<string, number>();
  const adj = new Map<string, string[]>();
  rawEdges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  });

  const queue = Array.from(rootNodeIds).map((id) => ({ id, d: 0 }));
  const visited = new Set<string>();
  while (queue.length > 0) {
    const { id, d } = queue.shift()!;
    if (!visited.has(id)) {
      visited.add(id);
      depths.set(id, d);
      for (const next of adj.get(id) || []) {
        queue.push({ id: next, d: d + 1 });
      }
    }
  }

  // Ensure disconnected nodes get depth
  rawNodes.forEach((n) => {
    if (!depths.has(n.id)) depths.set(n.id, 0);
  });

  const childCounts = new Map<string, number>();
  for (const edge of rawEdges) {
    childCounts.set(edge.source, (childCounts.get(edge.source) || 0) + 1);
  }

  rawNodes.forEach((node) => {
    const depth = depths.get(node.id) || 0;
    const width = Math.max(140, Math.min(node.label.length * 8 + 48, 240));
    const height = depth === 0 ? 48 : depth === 1 ? 42 : 36;
    g.setNode(node.id, { width, height });
  });

  rawEdges.forEach((edge) => {
    if (edge.source !== edge.target) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const nodes: Node[] = rawNodes.map((node) => {
    const depth = depths.get(node.id) || 0;
    const nodeWithPos = g.node(node.id) || { x: 0, y: 0 };
    const width = Math.max(140, Math.min(node.label.length * 8 + 48, 240));
    const height = depth === 0 ? 48 : depth === 1 ? 42 : 36;

    return {
      id: node.id,
      type: "mindmapNode",
      data: {
        label: node.label,
        depth,
        childCount: childCounts.get(node.id) || 0,
        isDimmed: false,
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
      position: {
        x: nodeWithPos.x - width / 2,
        y: nodeWithPos.y - height / 2,
      },
    };
  });

  const edges: Edge[] = rawEdges.map((edge, i) => {
    const sourceDepth = depths.get(edge.source) || 0;
    const isRootEdge = sourceDepth === 0;

    return {
      id: edge.id || `e-${edge.source}-${edge.target}-${i}`,
      source: edge.source,
      target: edge.target,
      type: "default",
      animated: false,
      style: {
        stroke: isRootEdge ? "var(--primary)" : "var(--border)",
        strokeWidth: isRootEdge ? 2 : 1.5,
        opacity: isRootEdge ? 0.5 : 0.7,
      },
      markerEnd: isRootEdge
        ? {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: "var(--primary)",
          }
        : undefined,
    };
  });

  return { nodes, edges };
}

export function MindmapFlow({
  nodes: rawNodes,
  edges: rawEdges,
}: MindmapFlowProps) {
  const [viewMode, setViewMode] = React.useState<"flow" | "tree">("flow");

  const layout = React.useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [layout, setNodes, setEdges]);

  // Subtree highlighting logic
  const handleNodeClick = React.useCallback(
    (_: React.MouseEvent, clickedNode: Node) => {
      // Find all descendants of clicked node
      const descendants = new Set<string>();
      const queue = [clickedNode.id];
      descendants.add(clickedNode.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const children = edges
          .filter((e) => e.source === curr)
          .map((e) => e.target);
        children.forEach((childId) => {
          if (!descendants.has(childId)) {
            descendants.add(childId);
            queue.push(childId);
          }
        });
      }

      // If node has no children, reset dimming
      if (descendants.size === 1) {
        setNodes((nds) =>
          nds.map((n) => ({ ...n, data: { ...n.data, isDimmed: false } })),
        );
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            style: { ...e.style, opacity: e.source === "0" ? 0.5 : 0.7 },
          })),
        );
        return;
      }

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isDimmed: !descendants.has(n.id) },
        })),
      );
      setEdges((eds) =>
        eds.map((e) => {
          const inTree = descendants.has(e.source) && descendants.has(e.target);
          const defaultOpacity = e.markerEnd ? 0.5 : 0.7;
          return {
            ...e,
            style: { ...e.style, opacity: inTree ? defaultOpacity : 0.1 },
          };
        }),
      );
    },
    [edges, setNodes, setEdges],
  );

  const handlePaneClick = React.useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, isDimmed: false } })),
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: { ...e.style, opacity: e.markerEnd ? 0.5 : 0.7 },
      })),
    );
  }, [setNodes, setEdges]);

  return (
    <div className="border-border/80 bg-card/40 relative h-[340px] sm:h-[440px] md:h-[500px] w-full overflow-hidden rounded-xl border shadow-xs backdrop-blur-xs">
      {viewMode === "tree" ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Outline view not implemented yet.
          </p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={32}
            size={0.5}
            className="opacity-20"
          />
          <Controls
            showInteractive={false}
            className="!border-border/30 !bg-card !rounded-xl !shadow-sm"
          />
        </ReactFlow>
      )}

      {/* Floating Panel for view toggle */}
      <div className="absolute top-2 right-2 z-10 p-2">
        <div className="border-border/40 bg-card/80 flex overflow-hidden rounded-lg border shadow-sm backdrop-blur-md">
          <button
            onClick={() => setViewMode("flow")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "flow"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            Map
          </button>
          <button
            onClick={() => setViewMode("tree")}
            className={cn(
              "border-border/40 border-l px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "tree"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            Outline
          </button>
        </div>
      </div>
    </div>
  );
}
