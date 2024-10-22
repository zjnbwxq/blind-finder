import { Plugin, WorkspaceLeaf, TFile, Notice, ReferenceCache } from 'obsidian';
import { t } from './i18n/i18n';
import { 
  analyzeGraphConnections, 
  detectWeakConnections, 
  detectIsolatedNotes, 
  calculateAdvancedConnectionStrength, 
  calculateCentrality 
} from './graphAnalysis';
import { GraphView, GRAPH_VIEW_TYPE } from './views/GraphView';
import { GraphNode, GraphLink, GraphData } from './types';

export default class BlindFinderPlugin extends Plugin {
  async onload() {
    this.registerView(
      GRAPH_VIEW_TYPE,
      (leaf) => new GraphView(leaf)
    );

    this.addCommand({
      id: 'open-blind-finder-graph',
      name: 'Open Knowledge Graph View',
      callback: () => this.activateView()
    });

    this.addCommand({
      id: 'analyze-current-note-connections',
      name: t('commands.analyzeConnections.name'),
      callback: () => this.analyzeCurrentNoteConnections()
    });

    this.addCommand({
      id: 'analyze-knowledge-graph',
      name: t('commands.analyzeKnowledgeGraph.name'),
      callback: () => this.analyzeKnowledgeGraph()
    });
  }

  onunload() {
    //console.log(t('common.plugin.unload'));
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(GRAPH_VIEW_TYPE)[0];
    
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: GRAPH_VIEW_TYPE, active: true });
      } else {
        console.error('Unable to create a new leaf for the graph view');
        return;
      }
    }

    if (leaf instanceof WorkspaceLeaf) {
      workspace.revealLeaf(leaf);
    } else {
      console.error('Leaf is not an instance of WorkspaceLeaf');
    }
  }

  async analyzeCurrentNoteConnections() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice(t('commands.analyzeConnections.noActiveNote'));
      return;
    }

    const links = await this.getFileLinks(activeFile);
    const backlinks = await this.getFileBacklinks(activeFile);

    const totalConnections = links.length + backlinks.length;
    new Notice(t('commands.analyzeConnections.result', {
      total: totalConnections,
      outgoing: links.length,
      incoming: backlinks.length
    }));
  }

  async analyzeKnowledgeGraph() {
    const files = this.app.vault.getMarkdownFiles();
    const connections = analyzeGraphConnections(files, this.app.metadataCache);
    
    const weakConnections = detectWeakConnections(connections, 3);
    const isolatedNotes = detectIsolatedNotes(connections);
    const strengthMap = calculateAdvancedConnectionStrength(connections);
    const centralityMap = calculateCentrality(connections);

    const topConnections = Array.from(strengthMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCentralNodes = Array.from(centralityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    new Notice(t('commands.analyzeKnowledgeGraph.result', {
      total: files.length,
      weak: weakConnections.length,
      isolated: isolatedNotes.length
    }));

    //console.log('Top 5 most connected notes:', topConnections);
    //console.log('Top 5 most central nodes:', topCentralNodes);
  }

  async getFileLinks(file: TFile): Promise<string[]> {
    const links = await this.app.metadataCache.getFileCache(file)?.links || [];
    return links.map(link => link.link);
  }

  async getFileBacklinks(file: TFile): Promise<string[]> {
    const backlinks = (this.app.metadataCache as any).getBacklinksForFile(file);
    return backlinks ? Object.keys(backlinks) : [];
  }
}
