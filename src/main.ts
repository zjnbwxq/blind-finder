import { Plugin, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { t } from './i18n/i18n';
import { 
  analyzeGraphConnections, 
  detectWeakConnections, 
  detectIsolatedNotes, 
  calculateAdvancedConnectionStrength, 
  calculateCentrality,
  analyzeContentDepth,
  extractConcepts,
  analyzeConceptRelations 
} from './graphAnalysis';
import { GraphView, GRAPH_VIEW_TYPE } from './views/GraphView';

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
    // 卸载插件时的逻辑
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(GRAPH_VIEW_TYPE)[0];
    
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: GRAPH_VIEW_TYPE, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
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

    const depthAnalysis = await Promise.all(files.map(async file => {
      const content = await this.app.vault.read(file);
      return analyzeContentDepth(content);
    }));

    const allContent = await Promise.all(files.map(file => this.app.vault.read(file)));
    const allConcepts = await extractConcepts(allContent.join(' '));
    const conceptRelations = await analyzeConceptRelations(
      allConcepts, 
      connections,
      async (file) => await this.app.vault.read(file)
    );

    // 这里可以添加更多的分析结果处理逻辑
  }

  async getFileLinks(file: TFile): Promise<string[]> {
    const links = this.app.metadataCache.getFileCache(file)?.links || [];
    return links.map(link => link.link);
  }

  async getFileBacklinks(file: TFile): Promise<string[]> {
    const resolvedLinks = this.app.metadataCache.resolvedLinks;
    const backlinks: string[] = [];

    for (const [sourcePath, targetLinks] of Object.entries(resolvedLinks)) {
      if (targetLinks[file.path]) {
        backlinks.push(sourcePath);
      }
    }

    return backlinks;
  }
}
