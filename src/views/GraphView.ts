import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from '../i18n/i18n';
import * as d3 from 'd3';
import { GraphNode, GraphLink, AnalysisResults } from '../types';
import BlindFinderPlugin from '../main';

export const GRAPH_VIEW_TYPE = 'blind-finder-graph-view';

export class GraphView extends ItemView {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
  private nodes: GraphNode[] = [];
  plugin: BlindFinderPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: BlindFinderPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return GRAPH_VIEW_TYPE;
  }

  getDisplayText(): string {
    return t('views.graph.title');
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h4', { text: t('views.graph.title') });
    
    this.svg = d3.select(container).append('svg')
      .attr('width', '100%')
      .attr('height', '500px');

    this.initializeSimulation();
    this.updateGraph(this.plugin.lastAnalysisResults);
  }

  initializeSimulation() {
    this.simulation = d3.forceSimulation<GraphNode, GraphLink>()
      .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(250, 250));
  }

  updateGraph(results: AnalysisResults | null) {
    if (!results) return;

    const nodes = results.connections.map(conn => ({
      id: conn.file.path,
      strength: results.strengthMap.get(conn.file.path) || 0,
      centrality: results.centralityMap.get(conn.file.path) || 0
    }));

    const links = results.connections.flatMap(conn => 
      conn.links.map(link => ({ 
        source: conn.file.path, 
        target: link,
        value: 1 
      }))
    );

    this.renderGraph(nodes, links);
  }

  renderGraph(nodes: GraphNode[], links: GraphLink[]) {
    this.nodes = nodes;  // 更新 nodes 属性

    if (!this.svg || !this.simulation) return;

    this.svg.selectAll('*').remove();

    const link = this.svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const node = this.svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => Math.sqrt(d.strength) * 5)
      .attr('fill', d => d3.interpolateBlues(d.centrality))
      .call(this.drag(this.simulation));

    node.append('title')
      .text(d => d.id);

    this.simulation
      .nodes(this.nodes)
      .on('tick', () => {
        link
          .attr('x1', d => this.getNodeCoordinate(d.source, 'x'))
          .attr('y1', d => this.getNodeCoordinate(d.source, 'y'))
          .attr('x2', d => this.getNodeCoordinate(d.target, 'x'))
          .attr('y2', d => this.getNodeCoordinate(d.target, 'y'));

        node
          .attr('cx', d => d.x!)
          .attr('cy', d => d.y!);
      });

    if (this.simulation) {
      const linkForce = this.simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link');
      if (linkForce) {
        linkForce.links(links);
      }
    } else {
      console.warn('Simulation is not initialized');
    }
  }

  drag(simulation: d3.Simulation<GraphNode, GraphLink> | null) {
    if (!simulation) return d3.drag<SVGCircleElement, GraphNode>();

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      if (!event.active && simulation) {
        simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
      if (!event.active && simulation) {
        simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGCircleElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  async onClose() {
    this.svg = null;
    this.simulation = null;
  }

  private getNodeCoordinate(node: string | GraphNode, coord: 'x' | 'y'): number {
    if (typeof node === 'string') {
      const foundNode = this.nodes.find(n => n.id === node);
      return foundNode ? foundNode[coord] || 0 : 0;
    }
    return node[coord] || 0;
  }
}
