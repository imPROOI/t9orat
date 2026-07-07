export type NodeType = 'input' | 'idea' | 'recommendation';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'custom';

export interface AppConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
}

export interface GraphData {
  nodes: {
    id: string;
    type: NodeType;
    label: string;
    description: string;
    ideaContext?: string;
    recommendationType?: string;
    searchQueries?: {
      label: string;
      query: string;
      site: 'google' | 'scholar' | 'youtube' | 'wikipedia';
    }[];
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    explanation: string;
  }[];
  suggestedTopics?: {
    title: string;
    description: string;
  }[];
  contrarianTopics?: {
    title: string;
    description: string;
  }[];
}
