import * as d3 from 'd3-force';
import { Node, Edge } from '@xyflow/react';
import { GraphData, CustomNodeData } from '../types';

export interface LayoutSimNode extends d3.SimulationNodeDatum {
  id: string;
  type: string;
  data: CustomNodeData;
  position: { x: number; y: number };
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface LayoutSimLink extends d3.SimulationLinkDatum<LayoutSimNode> {
  id: string;
  source: string | LayoutSimNode;
  target: string | LayoutSimNode;
  type?: string;
  data?: { explanation?: string; [key: string]: unknown };
}

/**
 * Runs simulation ticks in asynchronous chunks, yielding to the browser event loop
 * so that loading spinners and UI animations remain smooth and never freeze.
 */
async function runSimulationTicksAsync(
  simulation: d3.Simulation<LayoutSimNode, LayoutSimLink>,
  totalTicks: number = 300,
  batchSize: number = 40
): Promise<void> {
  simulation.stop();
  let completed = 0;
  while (completed < totalTicks) {
    const ticksToRun = Math.min(batchSize, totalTicks - completed);
    simulation.tick(ticksToRun);
    completed += ticksToRun;
    // Yield execution to allow paint / UI frame updates
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Runs simulation ticks synchronously.
 */
function runSimulationTicksSync(
  simulation: d3.Simulation<LayoutSimNode, LayoutSimLink>,
  totalTicks: number = 300
): void {
  simulation.stop();
  simulation.tick(totalTicks);
}

/**
 * Incremental layout algorithm that fixes existing nodes in place while positioning
 * new nodes organically around them. Non-blocking async execution.
 */
export async function applyIncrementalLayout(
  existingNodes: Node[],
  existingEdges: Edge[],
  newGraphData: GraphData
): Promise<{ nodes: Node<CustomNodeData>[]; edges: Edge[] }> {
  // Preserve existing node positions rigidly during simulation
  const preservedNodes: LayoutSimNode[] = existingNodes.map(n => ({
    id: n.id,
    type: n.type || 'customNode',
    data: (n.data || {}) as CustomNodeData,
    position: { x: n.position.x, y: n.position.y },
    fx: n.position.x,
    fy: n.position.y,
    x: n.position.x,
    y: n.position.y,
  }));

  const newNodes: LayoutSimNode[] = newGraphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: {
      label: n.label,
      type: n.type,
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries,
      customColor: n.customColor,
      userNotes: n.userNotes,
      aiExplanation: n.aiExplanation,
      starred: n.starred,
      isFaded: n.isFaded,
    },
    position: { x: 0, y: 0 },
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const allNodes: LayoutSimNode[] = [...preservedNodes, ...newNodes];
  const validNodeIds = new Set(allNodes.map(n => n.id));

  const newEdges: Edge[] = newGraphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  const allEdges: Edge[] = [...existingEdges, ...newEdges];
  const d3Edges: LayoutSimLink[] = allEdges.map(e => ({ ...e }));

  const linkForce = d3
    .forceLink<LayoutSimNode, LayoutSimLink>(d3Edges)
    .id((d: LayoutSimNode) => d.id)
    .distance(220);

  const simulation = d3
    .forceSimulation<LayoutSimNode>(allNodes)
    .force('charge', d3.forceManyBody<LayoutSimNode>().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', linkForce)
    .force('collide', d3.forceCollide<LayoutSimNode>().radius(130).iterations(3));

  await runSimulationTicksAsync(simulation, 300, 40);

  const finalNodes: Node<CustomNodeData>[] = allNodes.map(n => ({
    id: n.id,
    type: 'customNode',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n.data,
  }));

  return { nodes: finalNodes, edges: allEdges };
}

/**
 * Synchronous variant of applyIncrementalLayout.
 */
export function applyIncrementalLayoutSync(
  existingNodes: Node[],
  existingEdges: Edge[],
  newGraphData: GraphData
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
  const preservedNodes: LayoutSimNode[] = existingNodes.map(n => ({
    id: n.id,
    type: n.type || 'customNode',
    data: (n.data || {}) as CustomNodeData,
    position: { x: n.position.x, y: n.position.y },
    fx: n.position.x,
    fy: n.position.y,
    x: n.position.x,
    y: n.position.y,
  }));

  const newNodes: LayoutSimNode[] = newGraphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: {
      label: n.label,
      type: n.type,
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries,
      customColor: n.customColor,
      userNotes: n.userNotes,
      aiExplanation: n.aiExplanation,
      starred: n.starred,
      isFaded: n.isFaded,
    },
    position: { x: 0, y: 0 },
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const allNodes: LayoutSimNode[] = [...preservedNodes, ...newNodes];
  const validNodeIds = new Set(allNodes.map(n => n.id));

  const newEdges: Edge[] = newGraphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  const allEdges: Edge[] = [...existingEdges, ...newEdges];
  const d3Edges: LayoutSimLink[] = allEdges.map(e => ({ ...e }));

  const linkForce = d3
    .forceLink<LayoutSimNode, LayoutSimLink>(d3Edges)
    .id((d: LayoutSimNode) => d.id)
    .distance(220);

  const simulation = d3
    .forceSimulation<LayoutSimNode>(allNodes)
    .force('charge', d3.forceManyBody<LayoutSimNode>().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', linkForce)
    .force('collide', d3.forceCollide<LayoutSimNode>().radius(130).iterations(3));

  runSimulationTicksSync(simulation, 300);

  const finalNodes: Node<CustomNodeData>[] = allNodes.map(n => ({
    id: n.id,
    type: 'customNode',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n.data,
  }));

  return { nodes: finalNodes, edges: allEdges };
}

/**
 * Computes force-directed layout for an entirely new graph. Non-blocking async execution.
 */
export async function applyForceLayout(
  graphData: GraphData
): Promise<{ nodes: Node<CustomNodeData>[]; edges: Edge[] }> {
  const nodes: LayoutSimNode[] = graphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: {
      label: n.label,
      type: n.type,
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries,
      customColor: n.customColor,
      userNotes: n.userNotes,
      aiExplanation: n.aiExplanation,
      starred: n.starred,
      isFaded: n.isFaded,
    },
    position: { x: 0, y: 0 },
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const validNodeIds = new Set(nodes.map(n => n.id));

  const edges: Edge[] = graphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  const d3Edges: LayoutSimLink[] = edges.map(e => ({ ...e }));

  const linkForce = d3
    .forceLink<LayoutSimNode, LayoutSimLink>(d3Edges)
    .id((d: LayoutSimNode) => d.id)
    .distance(200);

  const simulation = d3
    .forceSimulation<LayoutSimNode>(nodes)
    .force('charge', d3.forceManyBody<LayoutSimNode>().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', linkForce)
    .force('collide', d3.forceCollide<LayoutSimNode>().radius(120).iterations(3));

  await runSimulationTicksAsync(simulation, 300, 40);

  const placedNodes: Node<CustomNodeData>[] = nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n.data,
  }));

  return { nodes: placedNodes, edges };
}

/**
 * Synchronous variant of applyForceLayout.
 */
export function applyForceLayoutSync(
  graphData: GraphData
): { nodes: Node<CustomNodeData>[]; edges: Edge[] } {
  const nodes: LayoutSimNode[] = graphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: {
      label: n.label,
      type: n.type,
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries,
      customColor: n.customColor,
      userNotes: n.userNotes,
      aiExplanation: n.aiExplanation,
      starred: n.starred,
      isFaded: n.isFaded,
    },
    position: { x: 0, y: 0 },
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const validNodeIds = new Set(nodes.map(n => n.id));

  const edges: Edge[] = graphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  const d3Edges: LayoutSimLink[] = edges.map(e => ({ ...e }));

  const linkForce = d3
    .forceLink<LayoutSimNode, LayoutSimLink>(d3Edges)
    .id((d: LayoutSimNode) => d.id)
    .distance(200);

  const simulation = d3
    .forceSimulation<LayoutSimNode>(nodes)
    .force('charge', d3.forceManyBody<LayoutSimNode>().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', linkForce)
    .force('collide', d3.forceCollide<LayoutSimNode>().radius(120).iterations(3));

  runSimulationTicksSync(simulation, 300);

  const placedNodes: Node<CustomNodeData>[] = nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    position: { x: n.x ?? 0, y: n.y ?? 0 },
    data: n.data,
  }));

  return { nodes: placedNodes, edges };
}
