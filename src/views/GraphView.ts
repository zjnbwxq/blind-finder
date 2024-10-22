import { ItemView, WorkspaceLeaf, App, TFile } from 'obsidian';
import { t } from '../i18n/i18n';
import * as d3 from 'd3';
import { GraphNode, GraphLink, GraphData } from '../types';
import { analyzeGraphConnections, calculateAdvancedConnectionStrength } from '../graphAnalysis';

export const GRAPH_VIEW_TYPE = 'blind-finder-graph-view';

export class GraphView extends ItemView {
  private canvas!: HTMLCanvasElement;
  private context!: CanvasRenderingContext2D;
  private width!: number;
  private height!: number;
  private simulation!: d3.Simulation<GraphNode, GraphLink>;
  private sizeScale!: d3.ScaleLinear<number, number>;
  private colorScale!: d3.ScaleSequential<string>;

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
    
    this.canvas = container.createEl('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.width = container.clientWidth;
    this.height = 500;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.initializeScales();
    this.initializeSimulation();
    this.renderGraph();
  }

  private initializeScales() {
    const data = this.prepareGraphData();
    
    this.sizeScale = d3.scaleLinear()
      .domain([0, d3.max(data.nodes, d => d.strength) || 1])
      .range([5, 20]);
    
    this.colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, d3.max(data.nodes, d => d.strength) || 1]);
  }

  private initializeSimulation() {
    const data = this.prepareGraphData();
    
    this.simulation = d3.forceSimulation<GraphNode>()
      .nodes(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => this.sizeScale(d.strength) + 1));

    this.simulation.on('tick', () => this.render());
  }

  private render() {
    this.context.clearRect(0, 0, this.width, this.height);
    
    
    this.context.strokeStyle = '#999';
    this.context.beginPath();
    this.simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link')!.links().forEach(d => {
      const sourceNode = this.getNodePosition(d.source);
      const targetNode = this.getNodePosition(d.target);
      if (sourceNode && targetNode) {
        this.context.moveTo(sourceNode.x, sourceNode.y);
        this.context.lineTo(targetNode.x, targetNode.y);
      }
    });
    this.context.stroke();

    
    this.simulation.nodes().forEach(d => {
      this.context.fillStyle = this.colorScale(d.strength);
      this.context.beginPath();
      this.context.moveTo(d.x!, d.y!);
      this.context.arc(d.x!, d.y!, this.sizeScale(d.strength), 0, 2 * Math.PI);
      this.context.fill();
    });
  }

  private getNodePosition(node: string | GraphNode | d3.SimulationNodeDatum): { x: number, y: number } | null {
    if (typeof node === 'string') {

      const foundNode = this.simulation.nodes().find(n => n.id === node);
      return foundNode ? { x: foundNode.x!, y: foundNode.y! } : null;
    } else if (node && 'x' in node && 'y' in node) {

      return { x: node.x!, y: node.y! };
    }
    return null;
  }

  private renderGraph() {
    d3.select(this.canvas)
      .call(d3.drag<HTMLCanvasElement, unknown>()
        .subject((event) => this.findNode(event.x, event.y))
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)) as any)
      .on('click', (event: MouseEvent) => {
        const node = this.findNode(event.offsetX, event.offsetY);
        if (node) this.openNote(node);
      })
      .on('mousemove', (event: MouseEvent) => {
        const node = this.findNode(event.offsetX, event.offsetY);
        if (node) {
          this.showNodeInfo(event, node);
        } else {
          this.hideNodeInfo();
        }
      });
  }

  private findNode(x: number, y: number): GraphNode | null {
    const radius = 20;
    for (let i = this.simulation.nodes().length - 1; i >= 0; --i) {
      const node = this.simulation.nodes()[i];
      const dx = x - node.x!;
      const dy = y - node.y!;
      if (dx * dx + dy * dy < radius * radius) {
        return node;
      }
    }
    return null;
  }

  private dragstarted(event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    const node = event.subject as GraphNode;
    node.fx = node.x;
    node.fy = node.y;
  }

  private dragged(event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>) {
    const node = event.subject as GraphNode;
    node.fx = event.x;
    node.fy = event.y;
  }

  private dragended(event: d3.D3DragEvent<HTMLCanvasElement, unknown, unknown>) {
    if (!event.active) this.simulation.alphaTarget(0);
    const node = event.subject as GraphNode;
    node.fx = null;
    node.fy = null;
  }

  private openNote(node: GraphNode) {
    const file = this.app.vault.getAbstractFileByPath(node.id);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf().openFile(file);
    }
  }

  private showNodeInfo(event: MouseEvent, node: GraphNode) {
    const tooltip = d3.select(this.containerEl).append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '5px')
      .style('border', '1px solid black')
      .style('border-radius', '5px')
      .style('pointer-events', 'none')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);

    tooltip.html(`
      <strong>${node.id}</strong><br>
      Strength: ${node.strength.toFixed(2)}<br>
      Connections: ${node.connections}
    `);
  }

  private hideNodeInfo() {
    d3.select(this.containerEl).selectAll('.graph-tooltip').remove();
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
        connections: conn.links.length
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
