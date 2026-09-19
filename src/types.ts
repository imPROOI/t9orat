export type NodeType = 'input' | 'idea' | 'recommendation';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'custom';

export interface AppConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
}

export interface SearchQuery {
  label: string;
  query: string;
  site: 'google' | 'scholar' | 'youtube' | 'wikipedia';
}

export interface TopicSuggestion {
  title: string;
  description: string;
}

export interface CustomNodeData {
  label: string;
  type: NodeType;
  description: string;
  ideaContext?: string;
  recommendationType?: string;
  searchQueries?: SearchQuery[];
  customColor?: string;
  userNotes?: string;
  aiExplanation?: string;
  starred?: boolean;
  isFaded?: boolean;
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  ideaContext?: string;
  recommendationType?: string;
  searchQueries?: SearchQuery[];
  customColor?: string;
  userNotes?: string;
  aiExplanation?: string;
  starred?: boolean;
  isFaded?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  explanation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  suggestedTopics?: TopicSuggestion[];
  contrarianTopics?: TopicSuggestion[];
}

export interface MindMapSessionData {
  version: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: CustomNodeData;
    [key: string]: unknown;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: { explanation?: string; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    exportedAt: string;
    appVersion?: string;
    [key: string]: unknown;
  };
}
