export default {
  commands: {
    analyzeConnections: {
      name: "Analyze current note connections",
      noActiveNote: "No active note",
      result: "Current note connections: {{total}}\nOutgoing links: {{outgoing}}\nIncoming links: {{incoming}}",
    },
    analyzeKnowledgeGraph: {
      name: "Analyze Knowledge Graph",
      result: "Analysis complete. Total notes: {{total}}, Weak connections: {{weak}}, Isolated notes: {{isolated}}"
    },
    openGraph: {
      name: "Open Knowledge Graph View"
    }
  },
  common: {
    plugin: {
      load: "Loading Blind Finder plugin",
      unload: "Unloading Blind Finder plugin",
    },
  },
  views: {
    graph: {
      title: "Knowledge Graph"
    }
  }
};
