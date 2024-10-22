import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { t } from '../i18n/i18n';
import * as d3 from 'd3';
import { GraphNode, GraphLink, GraphData } from '../types';
import { analyzeGraphConnections, calculateAdvancedConnectionStrength } from '../graphAnalysis';

export const GRAPH_VIEW_TYPE = 'blind-finder-graph-view';

export class GraphView extends ItemView {
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private container!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private simulation!: d3.Simulation<GraphNode, GraphLink>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
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
    
    const canvas = container.createEl('div');
    canvas.style.width = '100%';
    canvas.style.height = '500px';

    this.initializeGraph(canvas);
    this.renderGraph();
  }

  private initializeGraph(container: HTMLElement) {
    const width = container.clientWidth;
    const height = 500;

    this.svg = d3.select(container).append('svg')
      .attr('width', width)
      .attr('height', height);

    this.container = this.svg.append('g');

    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => {
        this.container.attr('transform', event.transform);
      });

    this.svg.call(this.zoomBehavior);

    this.simulation = d3.forceSimulation<GraphNode, GraphLink>()
      .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  private renderGraph() {
    const data = this.prepareGraphData();

    const link = this.container.selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d: GraphLink) => Math.sqrt(d.value));

    const node = this.container.selectAll<SVGCircleElement, GraphNode>('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 5)
      .attr('fill', (d: GraphNode) => d3.scaleOrdinal(d3.schemeCategory10)(d.group.toString()))
      .call(this.drag());

    node.append('title')
      .text((d: GraphNode) => d.id);

    this.simulation
      .nodes(data.nodes)
      .on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('cx', (d: GraphNode) => d.x!)
          .attr('cy', (d: GraphNode) => d.y!);
      });

    this.simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link')!.links(data.links);
  }

  private drag() {
    return d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => this.dragstarted(event, d))
      .on('drag', (event, d) => this.dragged(event, d))
      .on('end', (event, d) => this.dragended(event, d));
  }

  private dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, unknown>, d: GraphNode) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, unknown>, d: GraphNode) {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, unknown>, d: GraphNode) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  prepareGraphData(): GraphData {
    const files = this.app.vault.getMarkdownFiles();
    const connections = analyzeGraphConnections(files, this.app.metadataCache);
    const strengthMap = calculateAdvancedConnectionStrength(connections);

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, number>();

    connections.forEach((conn, index) => {
      nodeMap.set(conn.file.path, index);
      nodes.push({
        id: conn.file.path,
        group: 1, 
        strength: strengthMap.get(conn.file.path) || 0,
        index: undefined,
        x: undefined,
        y: undefined,
        vx: undefined,
        vy: undefined
      });

      conn.links.forEach(link => {
        links.push({
          source: conn.file.path,
          target: link,
          value: 1
        });
      });
    });

    return { nodes, links };
  }

  async onClose() {
   
  }
}
