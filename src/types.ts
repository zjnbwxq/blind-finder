import { SimulationNodeDatum } from 'd3-force';

export interface GraphNode extends SimulationNodeDatum {
  id: string;
  group: number;
  strength: number;
  connections: number;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

