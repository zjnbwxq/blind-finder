import { SimulationNodeDatum } from 'd3-force';
import { TFile } from 'obsidian';

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

export interface Concept {
  term: string;
  frequency: number;
}

export interface NoteConnection {
  file: TFile;
  links: string[];
  backlinks: string[];
  lastModified: number;
}
