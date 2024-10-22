import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from '../i18n/i18n';
import BlindFinderPlugin from '../main';
import { AnalysisResults } from '../types';

export const DASHBOARD_VIEW_TYPE = 'blind-finder-dashboard-view';

export class DashboardView extends ItemView {
  plugin: BlindFinderPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: BlindFinderPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return DASHBOARD_VIEW_TYPE;
  }

  getDisplayText(): string {
    return t('views.dashboard.title');
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h4', { text: t('views.dashboard.title') });
    
    this.updateDashboard(this.plugin.lastAnalysisResults);
  }

  updateDashboard(results: AnalysisResults | null) {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h4', { text: t('views.dashboard.title') });

    if (!results) {
      container.createEl('p', { text: 'No analysis results available. Run an analysis first.' });
      return;
    }

    const statsContainer = container.createEl('div', { cls: 'blind-finder-stats' });
    statsContainer.createEl('h5', { text: 'Knowledge Graph Statistics' });
    statsContainer.createEl('p', { text: `Total Notes: ${results.connections.length}` });
    statsContainer.createEl('p', { text: `Weak Connections: ${results.weakConnections.length}` });
    statsContainer.createEl('p', { text: `Isolated Notes: ${results.isolatedNotes.length}` });

    const topConceptsContainer = container.createEl('div', { cls: 'blind-finder-top-concepts' });
    topConceptsContainer.createEl('h5', { text: 'Top Concepts' });
    const topConcepts = results.allConcepts.slice(0, 10);
    const conceptList = topConceptsContainer.createEl('ul');
    topConcepts.forEach(concept => {
      conceptList.createEl('li', { text: `${concept.term} (${concept.frequency})` });
    });

    // 添加更多仪表板元素...
  }

  async onClose() {
    // 清理工作
  }
}

