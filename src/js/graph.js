/* global ORGS, vis, openModal */

let network = null;
let isGraphView = false;

// Expose toggle function to global scope
globalThis.setGraphView = function(showGraph) {
  isGraphView = showGraph;
  
  const gridViewBtn = document.getElementById('gridViewBtn');
  const graphViewBtn = document.getElementById('graphViewBtn');
  const orgGrid = document.getElementById('orgGrid');
  const graphContainer = document.getElementById('graphContainer');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  const searchInput = document.getElementById('searchInput');
  const catFilter = document.getElementById('categoryFilter');
  const complexityFilter = document.getElementById('complexityFilter');

  if (showGraph) {
    // Update button styles
    gridViewBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-all flex items-center gap-1";
    graphViewBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-zinc-900 shadow-sm transition-all flex items-center gap-1";
    
    // Switch visibility
    orgGrid.classList.add('hidden');
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    graphContainer.classList.remove('hidden');

    // Optionally disable filters that don't apply to graph view (or we could re-render graph based on filters)
    // For now, let's render the full ecosystem to show the macro-view
    
    // Initialize graph if not done yet
    if (!network) {
      initGraph();
    }
  } else {
    // Update button styles
    gridViewBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-zinc-900 shadow-sm transition-all flex items-center gap-1";
    graphViewBtn.className = "px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-all flex items-center gap-1";
    
    // Switch visibility
    orgGrid.classList.remove('hidden');
    // loadMore visibility is handled by app.js rendering logic, we could call applyFilters() to reset properly
    if (typeof applyFilters === 'function') {
      applyFilters();
    }
    graphContainer.classList.add('hidden');
  }
};

function initGraph() {
  const container = document.getElementById('graphNetwork');
  if (!container || typeof vis === 'undefined' || !ORGS) return;

  const nodes = [];
  const edges = [];
  
  const categories = new Set();
  const technologies = new Set();
  
  // Parse data
  ORGS.forEach((org, idx) => {
    // Add Organization Node (use index as ID to easily map back for openModal)
    nodes.push({
      id: idx,
      label: org.name,
      group: 'org',
      title: org.desc // tooltip
    });
    
    // Process Category
    if (org.cat) {
      const catId = 'cat_' + org.cat;
      if (!categories.has(catId)) {
        categories.add(catId);
        nodes.push({
          id: catId,
          label: org.cat.toUpperCase(),
          group: 'cat',
          title: 'Category: ' + org.cat
        });
      }
      edges.push({
        from: idx,
        to: catId,
        color: { opacity: 0.2 }
      });
    }
    
    // Process Technologies
    if (org.tags && Array.isArray(org.tags)) {
      // Only take top 3 tags to avoid massive clutter
      org.tags.slice(0, 3).forEach(tag => {
        const techId = 'tech_' + tag.toLowerCase();
        if (!technologies.has(techId)) {
          technologies.add(techId);
          nodes.push({
            id: techId,
            label: tag,
            group: 'tech',
            title: 'Technology: ' + tag
          });
        }
        edges.push({
          from: idx,
          to: techId,
          color: { opacity: 0.15 }
        });
      });
    }
  });

  const data = {
    nodes: new vis.DataSet(nodes),
    edges: new vis.DataSet(edges)
  };
  
  // Get CSS variables for theming support if needed
  const isDark = document.documentElement.classList.contains('dark');
  const textColor = isDark ? '#f4f4f5' : '#1a1c1c';

  const options = {
    nodes: {
      font: {
        family: 'Plus Jakarta Sans',
        size: 12,
        color: textColor
      },
      scaling: {
        min: 10,
        max: 30
      }
    },
    edges: {
      smooth: {
        type: 'continuous'
      },
      hoverWidth: 1.5
    },
    groups: {
      org: {
        shape: 'dot',
        size: 10,
        color: {
          background: '#1f2937', // zinc-800
          border: '#3f3f46',
          highlight: { background: '#f97316', border: '#c2410c' }, // primary orange
          hover: { background: '#fb923c', border: '#ea580c' }
        },
        font: { size: 10 }
      },
      cat: {
        shape: 'diamond',
        size: 20,
        color: {
          background: '#f97316', // orange
          border: '#c2410c',
          highlight: { background: '#f59e0b', border: '#b45309' }, // amber
          hover: { background: '#fbbf24', border: '#d97706' }
        },
        font: { size: 16, bold: true }
      },
      tech: {
        shape: 'box',
        color: {
          background: '#3b82f6', // blue
          border: '#2563eb',
          highlight: { background: '#60a5fa', border: '#3b82f6' },
          hover: { background: '#93c5fd', border: '#60a5fa' }
        },
        font: { size: 12, color: '#ffffff' },
        shapeProperties: {
          borderRadius: 4
        }
      }
    },
    physics: {
      forceAtlas2Based: {
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springLength: 100,
        springConstant: 0.08,
        damping: 0.4,
        avoidOverlap: 0.1
      },
      maxVelocity: 50,
      solver: 'forceAtlas2Based',
      timestep: 0.35,
      stabilization: {
        enabled: true,
        iterations: 200,
        updateInterval: 25
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      hideEdgesOnDrag: true
    }
  };

  network = new vis.Network(container, data, options);

  // Handle interactions
  network.on("click", function (params) {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      // If it's an organization node (id is an integer), open modal
      if (typeof nodeId === 'number' && typeof openModal === 'function') {
        openModal(nodeId);
      }
    }
  });
  
  // Highlight connected nodes on hover
  network.on("hoverNode", function (params) {
    const nodeId = params.node;
    const connectedEdges = network.getConnectedEdges(nodeId);
    
    // We could manually update colors here, but vis.js handles highlight natively 
    // if configured in groups. We just rely on the hover config for now.
    // For more advanced highlighting (e.g. dimming non-connected nodes), 
    // we would update the DataSet directly.
  });
}

// Watch for theme changes to update node text colors
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class' && network) {
      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#f4f4f5' : '#1a1c1c';
      network.setOptions({
        nodes: {
          font: { color: textColor }
        }
      });
    }
  });
});

observer.observe(document.documentElement, { attributes: true });
