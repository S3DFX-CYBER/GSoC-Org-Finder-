/* global ORGS, vis, openModal */
// Interactive Knowledge Graph Visualization
// Uses vis-network via CDN

let graphNetwork = null;
let graphInitialized = false;

function buildGraphData() {
  const nodes = [];
  const edges = [];
  const techNodes = {};
  let nodeId = 1;

  // Add org nodes
  ORGS.forEach((org, idx) => {
    nodes.push({
      id: `org_${idx}`,
      label: org.name.length > 20 ? org.name.substring(0, 18) + '…' : org.name,
      title: org.name,
      group: 'org',
      orgIdx: idx,
      shape: 'dot',
      size: 12,
      color: { background: '#f97316', border: '#ea580c', highlight: { background: '#fb923c', border: '#f97316' } },
      font: { size: 9, color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#3f3f46' }
    });

    // Add tech nodes and edges
    (org.tags || []).forEach(tag => {
      if (!techNodes[tag]) {
        techNodes[tag] = `tech_${nodeId++}`;
        nodes.push({
          id: techNodes[tag],
          label: tag,
          title: tag,
          group: 'tech',
          shape: 'diamond',
          size: 10,
          color: { background: '#6366f1', border: '#4f46e5', highlight: { background: '#818cf8', border: '#6366f1' } },
          font: { size: 10, color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#3f3f46' }
        });
      }
      edges.push({ from: `org_${idx}`, to: techNodes[tag], color: { color: '#d4d4d8', highlight: '#f97316' }, width: 1 });
    });
  });

  return { nodes, edges };
}

function initGraph() {
  if (graphInitialized) return;
  graphInitialized = true;

  const container = document.getElementById('knowledgeGraphContainer');
  if (!container) return;

  const { nodes, edges } = buildGraphData();

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges)
  };

  const options = {
    physics: {
      stabilization: { iterations: 150 },
      barnesHut: { gravitationalConstant: -8000, springLength: 80, springConstant: 0.04 }
    },
    interaction: { hover: true, tooltipDelay: 100 },
    nodes: { borderWidth: 1.5 },
    edges: { smooth: { type: 'continuous' } }
  };

  graphNetwork = new vis.Network(container, data, options);

  // Click org node → open modal
  graphNetwork.on('click', params => {
    if (params.nodes.length === 1) {
      const nodeId = params.nodes[0];
      if (String(nodeId).startsWith('org_')) {
        const idx = parseInt(nodeId.split('_')[1]);
        if (ORGS[idx]) openModal(ORGS[idx].name);
      }
    }
  });

  // Hover tech node → highlight connected orgs
  graphNetwork.on('hoverNode', params => {
    const nodeId = params.node;
    if (String(nodeId).startsWith('tech_')) {
      const connectedEdges = graphNetwork.getConnectedEdges(nodeId);
      const connectedNodes = graphNetwork.getConnectedNodes(nodeId);
      graphNetwork.selectNodes(connectedNodes);
    }
  });

  graphNetwork.on('blurNode', () => {
    graphNetwork.unselectAll();
  });
}

function toggleGraphView() {
  const graphSection = document.getElementById('graphViewSection');
  const orgGrid = document.getElementById('orgGrid');
  const toggleBtn = document.getElementById('graphToggleBtn');
  const pagination = document.getElementById('pagination');
  const emptyState = document.getElementById('emptyState');
  const isShowing = graphSection.style.display !== 'none';

  if (isShowing) {
    graphSection.style.display = 'none';
    orgGrid.style.display = '';
    if (pagination) pagination.style.display = '';
    if (emptyState) emptyState.style.display = '';
    toggleBtn.textContent = '🌐 Graph View';
  } else {
    graphSection.style.display = 'block';
    orgGrid.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    toggleBtn.textContent = '☰ List View';
    if (typeof vis === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.9/standalone/umd/vis-network.min.js';
      script.onload = () => initGraph();
      document.head.appendChild(script);
    } else {
      initGraph();
    }
  }
}