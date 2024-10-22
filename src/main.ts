import { Plugin, WorkspaceLeaf, TFile, Notice, PluginSettingTab, Setting, App } from 'obsidian';
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
import { DashboardView, DASHBOARD_VIEW_TYPE } from './views/DashboardView';
import { BlindFinderSettings, DEFAULT_SETTINGS, AnalysisResults } from './types';

export default class BlindFinderPlugin extends Plugin {
  settings: BlindFinderSettings = DEFAULT_SETTINGS;
  lastAnalysisResults: AnalysisResults | null = null;

  async onload() {
    await this.loadSettings();

    this.registerView(GRAPH_VIEW_TYPE, (leaf) => new GraphView(leaf, this));
    this.registerView(DASHBOARD_VIEW_TYPE, (leaf) => new DashboardView(leaf, this));

    this.addRibbonIcon('graph', 'Open Blind Finder Graph', () => this.activateView(GRAPH_VIEW_TYPE));

    this.addCommand({
      id: 'open-blind-finder-graph',
      name: t('commands.openGraph.name'),
      callback: () => this.activateView(GRAPH_VIEW_TYPE)
    });

    this.addCommand({
      id: 'open-blind-finder-dashboard',
      name: t('commands.openDashboard.name'),
      callback: () => this.activateView(DASHBOARD_VIEW_TYPE)
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

    this.addSettingTab(new BlindFinderSettingTab(this.app, this));

    if (this.settings.enableAutoAnalysis) {
      this.registerInterval(
        window.setInterval(() => this.analyzeKnowledgeGraph(), this.settings.analysisInterval * 60000)
      );
    }
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(GRAPH_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(DASHBOARD_VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView(viewType: string) {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(viewType)[0];
    
    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: viewType, active: true });
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

    const connections = analyzeGraphConnections([activeFile], this.app.metadataCache);
    const strength = calculateAdvancedConnectionStrength(connections);
    const depth = await analyzeContentDepth(await this.app.vault.read(activeFile));
    const concepts = await extractConcepts(await this.app.vault.read(activeFile));

    new Notice(t('commands.analyzeConnections.result', {
      total: connections[0].links.length + connections[0].backlinks.length,
      outgoing: connections[0].links.length,
      incoming: connections[0].backlinks.length,
      strength: strength.get(activeFile.path) || 0,
      depth: depth.overallScore
    }));

    // 更新图形视图和仪表板
    this.updateViews();
  }

  async analyzeKnowledgeGraph() {
    const files = this.app.vault.getMarkdownFiles();
    const connections = analyzeGraphConnections(files, this.app.metadataCache);
    
    const weakConnections = detectWeakConnections(connections, this.settings.minimumConnections);
    const isolatedNotes = detectIsolatedNotes(connections);
    const strengthMap = calculateAdvancedConnectionStrength(connections);
    const centralityMap = calculateCentrality(connections);

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

    this.lastAnalysisResults = {
      connections,
      weakConnections,
      isolatedNotes,
      strengthMap,
      centralityMap,
      depthAnalysis,
      allConcepts,
      conceptRelations
    };

    // 更新图形视图和仪表板
    this.updateViews();

    new Notice(t('commands.analyzeKnowledgeGraph.result', {
      total: files.length,
      weak: weakConnections.length,
      isolated: isolatedNotes.length
    }));
  }

  updateViews() {
    const graphLeaves = this.app.workspace.getLeavesOfType(GRAPH_VIEW_TYPE);
    const dashboardLeaves = this.app.workspace.getLeavesOfType(DASHBOARD_VIEW_TYPE);

    graphLeaves.forEach((leaf) => {
      if (leaf.view instanceof GraphView) {
        leaf.view.updateGraph(this.lastAnalysisResults);
      }
    });

    dashboardLeaves.forEach((leaf) => {
      if (leaf.view instanceof DashboardView) {
        leaf.view.updateDashboard(this.lastAnalysisResults);
      }
    });
  }
}

class BlindFinderSettingTab extends PluginSettingTab {
  plugin: BlindFinderPlugin;

  constructor(app: App, plugin: BlindFinderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;
    containerEl.empty();
    containerEl.createEl('h2', {text: 'Blind Finder Settings'});

    new Setting(containerEl)
      .setName('Enable Auto Analysis')
      .setDesc('Automatically analyze your knowledge graph at regular intervals')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableAutoAnalysis)
        .onChange(async (value) => {
          this.plugin.settings.enableAutoAnalysis = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Analysis Interval')
      .setDesc('How often to analyze the knowledge graph (in minutes)')
      .addText(text => text
        .setPlaceholder('60')
        .setValue(this.plugin.settings.analysisInterval.toString())
        .onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0) {
            this.plugin.settings.analysisInterval = numValue;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName('Minimum Connections')
      .setDesc('Minimum number of connections for a note to not be considered weak')
      .addText(text => text
        .setPlaceholder('3')
        .setValue(this.plugin.settings.minimumConnections.toString())
        .onChange(async (value) => {
          const numValue = parseInt(value);
          if (!isNaN(numValue) && numValue > 0) {
            this.plugin.settings.minimumConnections = numValue;
            await this.plugin.saveSettings();
          }
        }));

    // 添加更多设置...
  }
}
