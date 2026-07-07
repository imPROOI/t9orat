import * as d3 from 'd3-force';
import { Node, Edge } from '@xyflow/react';
import { GraphData } from '../types';

export function applyIncrementalLayout(
  existingNodes: Node[],
  existingEdges: Edge[],
  newGraphData: GraphData
): { nodes: Node[], edges: Edge[] } {
  
  // Preserve existing nodes positions rigidly during sim
  const preservedNodes = existingNodes.map(n => ({
    ...n,
    fx: n.position.x, 
    fy: n.position.y,
    x: n.position.x,
    y: n.position.y,
  }));

  const newNodes = newGraphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: { 
      label: n.label, 
      type: n.type, 
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries
    },
    position: { x: 0, y: 0 },
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const allNodes = [...preservedNodes, ...newNodes];
  const validNodeIds = new Set(allNodes.map(n => n.id));

  const newEdges = newGraphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  const allEdges = [...existingEdges, ...newEdges];
  const d3Edges = allEdges.map(e => ({ ...e }));

  const simulation = d3.forceSimulation(allNodes as any)
    .force('charge', d3.forceManyBody().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', d3.forceLink(d3Edges).id((d: any) => d.id).distance(220))
    .force('collide', d3.forceCollide().radius(130).iterations(3));

  // Run simulation statically so it organizes immediately without flickering
  simulation.stop();
  simulation.tick(300);

  const finalNodes: Node[] = allNodes.map((n: any) => {
    // We clean fx/fy so the user can freely explore or drag afterwards
    const { fx, fy, ...rest } = n;
    return {
      ...rest,
      id: n.id,
      position: { x: n.x, y: n.y },
    };
  });

  return { nodes: finalNodes, edges: allEdges };
}

export function applyForceLayout(graphData: GraphData): { nodes: Node[], edges: Edge[] } {
  const nodes = graphData.nodes.map(n => ({
    id: n.id,
    type: 'customNode',
    data: { 
      label: n.label, 
      type: n.type, 
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries
    },
    position: { x: 0, y: 0 }, // Will be overwritten by d3
    ...n, // Spread to keep any extra properties, but d3 will modify x/y
    x: Math.random() * 500 - 250,
    y: Math.random() * 500 - 250,
  }));

  const validNodeIds = new Set(nodes.map(n => n.id));

  const edges = graphData.edges
    .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map(e => ({
      id: `e-${e.source}-${e.target}-${Math.random().toString(36).substring(2, 9)}`,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { explanation: e.explanation },
    }));

  // Create a copy of edges for d3 since it mutates source/target to node objects
  const d3Edges = edges.map(e => ({ ...e }));

  const simulation = d3.forceSimulation(nodes as any)
    .force('charge', d3.forceManyBody().strength(-3000))
    .force('center', d3.forceCenter(0, 0))
    .force('link', d3.forceLink(d3Edges).id((d: any) => d.id).distance(200))
    .force('collide', d3.forceCollide().radius(120).iterations(3));

  // Run simulation statically
  simulation.stop();
  simulation.tick(300);

  const placedNodes: Node[] = nodes.map((n: any) => ({
    id: n.id,
    type: 'customNode',
    position: { x: n.x, y: n.y },
    data: { 
      label: n.label, 
      type: n.type, 
      description: n.description,
      ideaContext: n.ideaContext,
      recommendationType: n.recommendationType,
      searchQueries: n.searchQueries
    },
  }));

  return { nodes: placedNodes, edges };
}
