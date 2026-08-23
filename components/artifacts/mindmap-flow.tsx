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
import { LayoutGrid } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
 * Differentiates root/hub nodes with enhanced styling.
 */
function MindmapNode({
  data,
  selected,
}: {
  data: { label: string; isRoot?: boolean; childCount?: number };
  selected?: boolean;
}) {
  const isRoot = data.isRoot;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-2.5 rounded-xl px-4 py-2.5 shadow-sm transition-all duration-200",
        isRoot
          ? "bg-primary text-primary-foreground border-2 border-primary shadow-md font-semibold text-sm"
          : "bg-card text-card-foreground border border-border/80 hover:border-primary/50 text-xs font-medium",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-background !bg-primary/80 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <span className="truncate max-w-[220px] leading-snug">{data.label}</span>
      {data.childCount && data.childCount > 0 ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
            isRoot
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {data.childCount}
        </span>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-2 !border-background !bg-primary/80 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

const nodeTypes = {
  mindmapNode: MindmapNode,
};

function getLayoutedElements(
  rawNodes: RawNode[],
  rawEdges: RawEdge[],
  direction: "LR" | "TB" = "LR"
) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    ranksep: direction === "LR" ? 110 : 80,
    nodesep: direction === "LR" ? 35 : 60,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Identify root nodes (nodes with no incoming edges)
  const targetNodeIds = new Set(rawEdges.map((e) => e.target));
  const rootNodeIds = new Set(
    rawNodes.filter((n) => !targetNodeIds.has(n.id)).map((n) => n.id)
  );
  if (rootNodeIds.size === 0 && rawNodes.length > 0) {
    rootNodeIds.add(rawNodes[0].id);
  }

  // Count outgoing children per node
  const childCounts = new Map<string, number>();
  for (const edge of rawEdges) {
    childCounts.set(edge.source, (childCounts.get(edge.source) || 0) + 1);
  }

  const isHorizontal = direction === "LR";

  rawNodes.forEach((node) => {
    const isRoot = rootNodeIds.has(node.id);
    const width = Math.max(140, Math.min(node.label.length * 8 + 48, 240));
    const height = isRoot ? 48 : 42;
    g.setNode(node.id, { width, height });
  });

  rawEdges.forEach((edge) => {
    if (edge.source !== edge.target) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  const nodes: Node[] = rawNodes.map((node) => {
    const isRoot = rootNodeIds.has(node.id);
    const nodeWithPos = g.node(node.id) || { x: 0, y: 0 };
    const width = Math.max(140, Math.min(node.label.length * 8 + 48, 240));
    const height = isRoot ? 48 : 42;

    return {
      id: node.id,
      type: "mindmapNode",
      data: {
        label: node.label,
        isRoot,
        childCount: childCounts.get(node.id) || 0,
      },
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPos.x - width / 2,
        y: nodeWithPos.y - height / 2,
      },
    };
  });

  const edges: Edge[] = rawEdges.map((edge, i) => ({
    id: edge.id || `e-${edge.source}-${edge.target}-${i}`,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: false,
    style: { stroke: "var(--primary)", strokeWidth: 1.5, opacity: 0.65 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 14,
      height: 14,
      color: "var(--primary)",
    },
  }));

  return { nodes, edges };
}

export function MindmapFlow({ nodes: rawNodes, edges: rawEdges }: MindmapFlowProps) {
  const [direction, setDirection] = React.useState<"LR" | "TB">("LR");

  const layout = React.useMemo(
    () => getLayoutedElements(rawNodes, rawEdges, direction),
    [rawNodes, rawEdges, direction]
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

  function toggleDirection() {
    setDirection((curr) => (curr === "LR" ? "TB" : "LR"));
  }

  return (
    <div className="relative w-full h-[580px] rounded-xl border border-border/80 bg-card/40 backdrop-blur-xs overflow-hidden shadow-xs">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
        <Controls showInteractive={false} className="!border-border/60 !bg-card !shadow-md !rounded-lg" />
        
        <Panel position="top-right" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDirection}
            className="h-8 gap-1.5 rounded-lg border-border/60 bg-card/80 text-xs font-medium shadow-xs backdrop-blur-sm hover:bg-accent"
            title="Toggle diagram layout direction"
          >
            <LayoutGrid className="size-3.5 text-primary" />
            <span>{direction === "LR" ? "Horizontal" : "Vertical"}</span>
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
