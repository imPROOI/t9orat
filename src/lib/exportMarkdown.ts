import { Node, Edge } from '@xyflow/react';

export function exportToMarkdown(nodes: Node[], edges: Edge[]) {
  if (nodes.length === 0) return;

  let markdown = `# خريطة الأفكار (Mind Map)\n\nتم إنشاؤها عبر T9orat.\n\n`;

  // Find root node or main nodes (nodes with no incoming edges)
  const incomingEdgesCount = new Map<string, number>();
  nodes.forEach(n => incomingEdgesCount.set(n.id, 0));
  edges.forEach(e => {
    incomingEdgesCount.set(e.target, (incomingEdgesCount.get(e.target) || 0) + 1);
  });

  const mainNodes = nodes.filter(n => incomingEdgesCount.get(n.id) === 0);

  markdown += `## الأفكار الرئيسية\n\n`;

  // Write nodes
  nodes.forEach(node => {
    markdown += `### ${node.data.label}\n`;
    if (node.data.type) {
      markdown += `**النوع**: ${node.data.type}\n\n`;
    }
    if (node.data.description) {
      markdown += `${node.data.description}\n\n`;
    }
    if (node.data.ideaContext) {
      markdown += `*السياق:* ${node.data.ideaContext}\n\n`;
    }
    
    const outgoingEdges = edges.filter(e => e.source === node.id);
    if (outgoingEdges.length > 0) {
      markdown += `**متصلة بـ:**\n`;
      outgoingEdges.forEach(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (targetNode) {
          markdown += `- **${targetNode.data.label}**: ${edge.data?.explanation || 'ارتباط'}\n`;
        }
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  });

  // Download logic
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `symphony-graph-${new Date().toISOString().slice(0, 10)}.md`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
