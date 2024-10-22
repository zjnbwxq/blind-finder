import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { TFile } from 'obsidian';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group?: number;
  strength: number;
  centrality: number;
  connections?: number;
  x?: number;
  y?: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value?: number;
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

export interface ContentDepthAnalysis {
  wordCount: number;
  citationCount: number;
  headingLevels: number;
  codeBlockCount: number;
  formulaCount: number;
  keyPhrases: string[];
  readabilityScore: number;
  uniqueWordsCount: number;
  overallScore: number;
}

export interface AnalysisResults {
  connections: NoteConnection[];
  weakConnections: TFile[];
  isolatedNotes: TFile[];
  strengthMap: Map<string, number>;
  centralityMap: Map<string, number>;
  depthAnalysis: ContentDepthAnalysis[];
  allConcepts: Concept[];
  conceptRelations: Map<string, string[]>;
}

export interface BlindFinderSettings {
  enableAutoAnalysis: boolean;
  analysisInterval: number;
  minimumConnections: number;
  depthThreshold: number;
  showGraphView: boolean;
  enableNotifications: boolean;
  highlightWeakNodes: boolean;
  customStopwords: string[];
  ignoreFolders: string[];
  conceptThreshold: number;
}

export const DEFAULT_SETTINGS: BlindFinderSettings = {
  enableAutoAnalysis: false,
  analysisInterval: 60,
  minimumConnections: 3,
  depthThreshold: 0.5,
  showGraphView: true,
  enableNotifications: true,
  highlightWeakNodes: true,
  customStopwords: [],
  ignoreFolders: [],
  conceptThreshold: 0.1
};
