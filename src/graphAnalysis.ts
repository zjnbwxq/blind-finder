import { TFile, MetadataCache } from 'obsidian';

interface NoteConnection {
  file: TFile;
  links: string[];
  backlinks: string[];
  lastModified: number;
}

export function analyzeGraphConnections(files: TFile[], metadataCache: MetadataCache): NoteConnection[] {
  return files.map(file => ({
    file,
    links: getFileLinks(file, metadataCache),
    backlinks: getFileBacklinks(file, metadataCache),
    lastModified: file.stat.mtime
  }));
}

function getFileLinks(file: TFile, metadataCache: MetadataCache): string[] {
  const links = metadataCache.getFileCache(file)?.links || [];
  return links.map(link => link.link);
}

function getFileBacklinks(file: TFile, metadataCache: MetadataCache): string[] {
  const backlinks = (metadataCache as any).getBacklinksForFile(file);
  return backlinks ? Object.keys(backlinks) : [];
}

export function detectWeakConnections(connections: NoteConnection[], threshold: number): TFile[] {
  return connections
    .filter(conn => (conn.links.length + conn.backlinks.length) < threshold)
    .map(conn => conn.file);
}

export function detectIsolatedNotes(connections: NoteConnection[]): TFile[] {
  return connections
    .filter(conn => conn.links.length === 0 && conn.backlinks.length === 0)
    .map(conn => conn.file);
}

export function calculateConnectionStrength(connections: NoteConnection[]): Map<string, number> {
  const strengthMap = new Map<string, number>();
  
  connections.forEach(conn => {
    const strength = conn.links.length + conn.backlinks.length;
    strengthMap.set(conn.file.path, strength);
  });

  return strengthMap;
}

export function calculateAdvancedConnectionStrength(connections: NoteConnection[]): Map<string, number> {
  const strengthMap = new Map<string, number>();
  const now = Date.now();
  
  connections.forEach(conn => {
    let strength = 0;
    
    
    strength += conn.links.length * 1;
    
    
    strength += conn.backlinks.length * 1.5;
    
    
    const daysSinceModified = (now - conn.lastModified) / (1000 * 60 * 60 * 24);
    if (daysSinceModified <= 30) {
      strength += (30 - daysSinceModified) / 10;
    }
    
    
    const depthScore = calculateDepthScore(conn, connections);
    strength += depthScore;
    
    strengthMap.set(conn.file.path, strength);
  });

  return strengthMap;
}

function calculateDepthScore(conn: NoteConnection, allConnections: NoteConnection[]): number {
  const directBacklinks = new Set(conn.backlinks);
  let indirectBacklinks = new Set<string>();
  
  allConnections.forEach(otherConn => {
    if (directBacklinks.has(otherConn.file.path)) {
      otherConn.backlinks.forEach(backlink => indirectBacklinks.add(backlink));
    }
  });
  

  indirectBacklinks = new Set([...indirectBacklinks].filter(x => !directBacklinks.has(x)));
  
  return directBacklinks.size + (indirectBacklinks.size * 0.5);
}

export function calculateCentrality(connections: NoteConnection[]): Map<string, number> {
  const centralityMap = new Map<string, number>();
  const graph = new Map<string, Set<string>>();


  connections.forEach(conn => {
    if (!graph.has(conn.file.path)) {
      graph.set(conn.file.path, new Set());
    }
    conn.links.forEach(link => {
      graph.get(conn.file.path)!.add(link);
      if (!graph.has(link)) {
        graph.set(link, new Set());
      }
      graph.get(link)!.add(conn.file.path);
    });
  });


  graph.forEach((neighbors, node) => {
    centralityMap.set(node, neighbors.size);
  });

  return centralityMap;
}
