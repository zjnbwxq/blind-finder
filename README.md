# Blind Finder for Obsidian

Blind Finder 是一个 Obsidian 插件，旨在帮助用户分析和优化他们的知识图谱。它可以检测弱连接和孤立的笔记，分析笔记的深度，并提供可视化的知识图谱视图。

## 功能特点

- 知识图谱分析
- 弱连接和孤立笔记检测
- 笔记深度分析
- 概念提取和关系分析
- 可视化知识图谱
- 仪表板视图
- 自动分析功能

## 安装

1. 打开 Obsidian 设置
2. 进入 "第三方插件"
3. 禁用 "安全模式"
4. 点击 "浏览" 并搜索 "Blind Finder"
5. 点击 "安装"
6. 启用插件

## 使用方法

### 分析当前笔记连接

1. 打开一个笔记
2. 使用命令面板（Ctrl/Cmd + P）
3. 搜索并执行 "Analyze current note connections" 命令

### 分析整个知识图谱

1. 使用命令面板（Ctrl/Cmd + P）
2. 搜索并执行 "Analyze Knowledge Graph" 命令

### 打开知识图谱视图

1. 使用命令面板（Ctrl/Cmd + P）
2. 搜索并执行 "Open Knowledge Graph View" 命令

### 打开仪表板视图

1. 使用命令面板（Ctrl/Cmd + P）
2. 搜索并执行 "Open Blind Finder Dashboard" 命令

## 设置

在 Obsidian 设置中，你可以找到 Blind Finder 的设置选项：

- 启用自动分析：定期自动分析你的知识图谱
- 分析间隔：设置自动分析的时间间隔（分钟）
- 最小连接数：设置判定为弱连接的阈值
- 深度阈值：设置判定笔记深度的阈值
- 显示图形视图：是否在侧边栏显示图形视图
- 启用通知：是否显示分析结果通知
- 高亮弱节点：在图形视图中高亮显示弱连接节点
- 自定义停用词：设置在概念提取中忽略的词语
- 忽略文件夹：设置在分析中忽略的文件夹
- 概念阈值：设置概念提取的频率阈值

## 常见问题

Q: 插件分析需要多长时间？
A: 分析时间取决于你的知识库大小。对于大型知识库，可能需要几分钟。

Q: 如何提高分析速度？
A: 你可以在设置中增加最小连接数和概念阈值，或者忽略一些不需要分析的文件夹。

Q: 图形视图中的节点颜色代表什么？
A: 节点颜色表示笔记的中心性，颜色越深表示笔记在知识图谱中越重要。

Q: 如何解释仪表板中的数据？
A: 仪表板显示了你的知识图谱的整体状况，包括总笔记数、弱连接数、孤立笔记数等。它还展示了最重要的概念和它们之间的关系。

## 支持

如果你遇到任何问题或有任何建议，请在 GitHub 上提交 issue。

## 许可

本插件采用 MIT 许可证。详情请见 LICENSE 文件。



# Blind Finder for Obsidian

Blind Finder is an Obsidian plugin designed to help users analyze and optimize their knowledge graph. It detects weak connections and isolated notes, analyzes note depth, and provides a visual knowledge graph view.

## Features

- Knowledge graph analysis
- Detection of weak connections and isolated notes
- Note depth analysis
- Concept extraction and relationship analysis
- Visual knowledge graph
- Dashboard view
- Automatic analysis function

## Installation

1. Open Obsidian Settings
2. Go to "Third-party plugins"
3. Disable "Safe mode"
4. Click "Browse" and search for "Blind Finder"
5. Click "Install"
6. Enable the plugin

## Usage

### Analyze Current Note Connections

1. Open a note
2. Use the command palette (Ctrl/Cmd + P)
3. Search for and execute the "Analyze current note connections" command

### Analyze Entire Knowledge Graph

1. Use the command palette (Ctrl/Cmd + P)
2. Search for and execute the "Analyze Knowledge Graph" command

### Open Knowledge Graph View

1. Use the command palette (Ctrl/Cmd + P)
2. Search for and execute the "Open Knowledge Graph View" command

### Open Dashboard View

1. Use the command palette (Ctrl/Cmd + P)
2. Search for and execute the "Open Blind Finder Dashboard" command

## Settings

In Obsidian settings, you can find Blind Finder's options:

- Enable Auto Analysis: Periodically analyze your knowledge graph automatically
- Analysis Interval: Set the time interval for automatic analysis (in minutes)
- Minimum Connections: Set the threshold for determining weak connections
- Depth Threshold: Set the threshold for determining note depth
- Show Graph View: Whether to display the graph view in the sidebar
- Enable Notifications: Whether to show analysis result notifications
- Highlight Weak Nodes: Highlight weak connection nodes in the graph view
- Custom Stopwords: Set words to ignore in concept extraction
- Ignore Folders: Set folders to ignore in the analysis
- Concept Threshold: Set the frequency threshold for concept extraction

## FAQ

Q: How long does the plugin analysis take?
A: Analysis time depends on the size of your knowledge base. For large knowledge bases, it may take a few minutes.

Q: How can I improve analysis speed?
A: You can increase the minimum connections and concept threshold in settings, or ignore some folders that don't need analysis.

Q: What do the node colors in the graph view represent?
A: Node colors represent the centrality of notes. Darker colors indicate more important notes in the knowledge graph.

Q: How do I interpret the data in the dashboard?
A: The dashboard shows the overall state of your knowledge graph, including total notes, weak connections, isolated notes, etc. It also displays the most important concepts and their relationships.

## Support

If you encounter any issues or have any suggestions, please submit an issue on GitHub.

## License

This plugin is licensed under the MIT License. See the LICENSE file for details.