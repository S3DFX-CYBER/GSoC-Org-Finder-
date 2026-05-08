const nodes = document.querySelectorAll('.graph-node');

nodes.forEach((node) => {
  node.addEventListener('click', () => {
    nodes.forEach((n) => n.classList.remove('active'));
    node.classList.add('active');
  });
});