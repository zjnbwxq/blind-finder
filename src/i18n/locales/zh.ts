export default {
  commands: {
    analyzeConnections: {
      name: "分析当前笔记的连接度",
      noActiveNote: "没有打开的笔记",
      result: "当前笔记的连接度：{{total}}\n出链：{{outgoing}}\n入链：{{incoming}}",
    },
    analyzeKnowledgeGraph: {
      name: "分析知识图谱",
      result: "分析完成。总笔记数：{{total}}，弱连接笔记：{{weak}}，孤立笔记：{{isolated}}"
    },
    openGraph: {
      name: "打开知识图谱视图"
    }
  },
  common: {
    plugin: {
      load: "加载 Blind Finder 插件",
      unload: "卸载 Blind Finder 插件",
    },
  },
  views: {
    graph: {
      title: "知识图谱"
    }
  }
};
