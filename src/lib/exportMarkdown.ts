import { Node, Edge } from '@xyflow/react';
import { CustomNodeData } from '../types';

/**
 * Escapes Markdown control and special characters to prevent formatting corruption.
 */
export function escapeMarkdown(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/([*_{}[\]()#+\-.!`|<>~])/g, '\\$1');
}

/**
 * Translates node types into friendly Arabic labels
 */
function getNodeTypeLabel(type?: string): string {
  switch (type) {
    case 'input':
      return 'مدخل أساسي';
    case 'idea':
      return 'فكرة مبتكرة';
    case 'recommendation':
      return 'مصدر / توصية';
    default:
      return 'عنصر';
  }
}

/**
 * Exports the current mind map nodes and edges as a cleanly formatted Markdown document.
 */
export function exportToMarkdown(nodes: Node[], edges: Edge[], title?: string): void {
  if (nodes.length === 0) return;

  const now = new Date();
  const formattedDate = now.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mapTitle = title?.trim() || 'خريطة الأفكار (Mind Map)';

  let markdown = `# ${escapeMarkdown(mapTitle)}\n\n`;
  markdown += `> تم إنشاؤها عبر تطبيق **تصوّرات (Tasaowrat)** في ${formattedDate}.\n`;
  markdown += `> إجمالي العقد: **${nodes.length}** | إجمالي الروابط: **${edges.length}**\n\n`;
  markdown += `---\n\n`;

  // Find incoming edge count to identify root nodes
  const incomingCount = new Map<string, number>();
  nodes.forEach(n => incomingCount.set(n.id, 0));
  edges.forEach(e => {
    incomingCount.set(e.target, (incomingCount.get(e.target) || 0) + 1);
  });

  markdown += `## 🧭 ملخص هيكل الخريطة\n\n`;

  nodes.forEach((node, idx) => {
    const data = (node.data || {}) as CustomNodeData;
    const label = data.label ? escapeMarkdown(data.label) : `عقدة ${idx + 1}`;
    const typeLabel = getNodeTypeLabel(data.type);

    markdown += `### ${idx + 1}. [${typeLabel}] ${label}\n\n`;

    if (data.description) {
      markdown += `**الوصف:** ${escapeMarkdown(data.description)}\n\n`;
    }

    if (data.ideaContext) {
      markdown += `* **السياق والتطبيق الواقعي:** ${escapeMarkdown(data.ideaContext)}\n`;
    }

    if (data.recommendationType) {
      markdown += `* **نوع التوصية / المصدر:** ${escapeMarkdown(data.recommendationType)}\n`;
    }

    // Include user notes if present
    if (data.userNotes && data.userNotes.trim()) {
      markdown += `\n**📝 ملاحظاتي الخاصة:**\n> ${escapeMarkdown(data.userNotes.trim()).replace(/\n/g, '\n> ')}\n\n`;
    }

    // Include search queries if present
    if (Array.isArray(data.searchQueries) && data.searchQueries.length > 0) {
      markdown += `\n**🔍 روابط وبحوث مقترحة:**\n`;
      data.searchQueries.forEach(sq => {
        const sqLabel = escapeMarkdown(sq.label);
        const sqQuery = escapeMarkdown(sq.query);
        const siteName = sq.site.toUpperCase();
        markdown += `- [${siteName}] **${sqLabel}**: \`${sqQuery}\`\n`;
      });
      markdown += `\n`;
    }

    // Include outgoing connections
    const outgoing = edges.filter(e => e.source === node.id);
    if (outgoing.length > 0) {
      markdown += `**🔗 الروابط المتصلة:**\n`;
      outgoing.forEach(edge => {
        const targetNode = nodes.find(n => n.id === edge.target);
        const targetLabel = targetNode?.data?.label ? escapeMarkdown(String(targetNode.data.label)) : edge.target;
        const explanation = (edge.data as { explanation?: string })?.explanation;
        if (explanation) {
          markdown += `- **← ${targetLabel}:** ${escapeMarkdown(explanation)}\n`;
        } else {
          markdown += `- **← ${targetLabel}**\n`;
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
  const safeFilename = mapTitle
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF_-]/gi, '_')
    .slice(0, 40) || 'mindmap';

  link.download = `t9orat-${safeFilename}-${now.toISOString().slice(0, 10)}.md`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
