import React, { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
  BackgroundVariant,
  SelectionMode
} from '@xyflow/react';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';

const nodeTypes = {
  customNode: CustomNode,
};

const edgeTypes = {
  customEdge: CustomEdge,
};

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
  onEdgeClick: (edge: Edge) => void;
  onInit?: (instance: any) => void;
  children?: React.ReactNode;
}

export function GraphCanvas({ 
  nodes: initialNodes, 
  edges: initialEdges, 
  onNodeClick, 
  onEdgeClick,
  onInit,
  children
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const edgesRef = useRef(initialEdges);
  useEffect(() => {
    edgesRef.current = initialEdges;
  }, [initialEdges]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[], edges: Edge[] }) => {
    if (selectedNodes.length === 1 && selectedNodes[0].data.type === 'idea') {
      const selectedId = selectedNodes[0].id;
      
      const connectedNodeIds = new Set<string>();
      const connectedEdgeIds = new Set<string>();
      const currentEdges = edgesRef.current;
      
      const traverseUp = (nodeId: string) => {
        connectedNodeIds.add(nodeId);
        currentEdges.forEach((e) => {
          if (e.target === nodeId) {
             connectedEdgeIds.add(e.id);
             if (!connectedNodeIds.has(e.source)) traverseUp(e.source);
          }
        });
      };

      const traverseDown = (nodeId: string) => {
        connectedNodeIds.add(nodeId);
        currentEdges.forEach((e) => {
          if (e.source === nodeId) {
             connectedEdgeIds.add(e.id);
             if (!connectedNodeIds.has(e.target)) traverseDown(e.target);
          }
        });
      };

      traverseUp(selectedId);
      traverseDown(selectedId);

      setNodes((nds) => nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isFaded: !connectedNodeIds.has(n.id)
        }
      })));

      setEdges((eds) => eds.map((e) => ({
        ...e,
        animated: connectedEdgeIds.has(e.id),
        data: {
          ...e.data,
          isHighlighted: connectedEdgeIds.has(e.id),
          isFaded: !connectedEdgeIds.has(e.id)
        }
      })));
      
    } else {
      setNodes((nds) => nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isFaded: false
        }
      })));
      setEdges((eds) => eds.map((e) => ({
        ...e,
        animated: false,
        data: {
          ...e.data,
          isHighlighted: false,
          isFaded: false
        }
      })));
    }
  }, [setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(node);
  }, [onNodeClick]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    onEdgeClick(edge);
  }, [onEdgeClick]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        selectionMode={SelectionMode.Partial}
        edgesFocusable={true}
        className="bg-transparent"
        proOptions={{ hideAttribution: true }}
        onInit={onInit}
      >
        <Background 
          color="rgba(115, 118, 106, 0.15)"
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
        />
        {children}
      </ReactFlow>
    </div>
  );
}