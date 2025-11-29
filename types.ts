export interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'task' | 'decision' | 'milestone' | 'end';
  x: number;
  y: number;
  width?: number;
  height?: number;
  status: 'pending' | 'completed';
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Flow {
  id: string;
  title: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  updatedAt: Date;
}

export interface Coordinates {
  x: number;
  y: number;
}