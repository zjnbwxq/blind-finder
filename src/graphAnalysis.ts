import { TFile, MetadataCache } from 'obsidian';
import nlp from 'compromise';

interface NoteConnection {
  file: TFile;
  links: string[];
  backlinks: string[];
  lastModified: number;
}

interface ContentDepthAnalysis {
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

interface Concept {
  term: string;
  frequency: number;
}

const manager = nlp;

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
  const resolvedLinks = metadataCache.resolvedLinks;
  const backlinks: string[] = [];

  for (const [sourcePath, targetLinks] of Object.entries(resolvedLinks)) {
    if (targetLinks[file.path]) {
      backlinks.push(sourcePath);
    }
  }

  return backlinks;
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

export function calculateAdvancedConnectionStrength(connections: NoteConnection[]): Map<string, number> {
  const strengthMap = new Map<string, number>();
  const now = Date.now();
  
  connections.forEach(conn => {
    let strength = conn.links.length + conn.backlinks.length * 1.5;
    
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

export async function analyzeContentDepth(content: string): Promise<ContentDepthAnalysis> {
  const wordCount = content.split(/\s+/).length;
  const citationCount = (content.match(/\[\[.*?\]\]/g) || []).length;
  const headingLevels = Math.max(...(content.match(/^#+/gm) || []).map(h => h.length));
  const codeBlockCount = (content.match(/```[\s\S]*?```/g) || []).length;
  const formulaCount = (content.match(/\$\$[\s\S]*?\$\$/g) || []).length;
  
  const keyPhrases = await extractKeyPhrases(content);

  const readabilityScore = calculateReadabilityScore(content);
  const uniqueWordsCount = new Set(content.toLowerCase().match(/\b\w+\b/g)).size;

  const overallScore = (
    wordCount * 0.2 +
    citationCount * 0.15 +
    headingLevels * 0.15 +
    codeBlockCount * 0.1 +
    formulaCount * 0.1 +
    readabilityScore * 0.2 +
    uniqueWordsCount * 0.1
  ) / 7;

  return {
    wordCount,
    citationCount,
    headingLevels,
    codeBlockCount,
    formulaCount,
    keyPhrases,
    readabilityScore,
    uniqueWordsCount,
    overallScore
  };
}

function calculateReadabilityScore(text: string): number {

  const sentences = text.split(/[.!?]+/);
  const words = text.match(/\b\w+\b/g) || [];
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((sum, word) => sum + countSyllables(word), 0) / words.length;
  return 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
}

function countSyllables(word: string): number {

  return word.toLowerCase().split(/[aeiou]/).length - 1 || 1;
}

export async function extractConcepts(content: string): Promise<Concept[]> {
  const doc = nlp(content);
  const terms = doc.terms().out('array');
  
 
  const frequencyMap = new Map<string, number>();
  terms.forEach((term: string) => {
    const normalized = term.toLowerCase();
    frequencyMap.set(normalized, (frequencyMap.get(normalized) || 0) + 1);
  });

 
  const concepts = Array.from(frequencyMap.entries())
    .map(([term, frequency]) => ({ term, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20); 

  return concepts;
}

export async function analyzeConceptRelations(concepts: Concept[], connections: NoteConnection[], getFileContent: (file: TFile) => Promise<string>): Promise<Map<string, string[]>> {
  const conceptRelations = new Map<string, string[]>();

  for (const concept of concepts) {
    const relatedTerms = new Set<string>();
    
    for (const conn of connections) {
      const content = await getFileContent(conn.file);
      const doc = nlp(content);
      
      if (doc.has(concept.term)) {
        const context = doc.sentences().filter((s: any) => s.has(concept.term)).out('array');
        
        context.forEach((sentence: string) => {
          const terms = nlp(sentence).terms().out('array');
          terms.forEach((term: string) => {
            if (term !== concept.term && !isStopWord(term)) {
              relatedTerms.add(term);
            }
          });
        });
      }
    }

    conceptRelations.set(concept.term, Array.from(relatedTerms));
  }

  return conceptRelations;
}

function isStopWord(word: string): boolean {

  const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'but']);
  return stopWords.has(word.toLowerCase());
}

export async function extractKeyPhrases(content: string): Promise<string[]> {
  const doc = nlp(content);
  return doc.topics().out('array');
}
