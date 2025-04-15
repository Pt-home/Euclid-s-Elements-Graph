let network;
let data;
let physicsEnabled = true;
let currentTheme = "light";

// === ІНІЦІАЛІЗАЦІЯ ===
window.addEventListener("DOMContentLoaded", async () => {
  showLoader("Завантаження графа, зачекайте...");

  data = await fetch("Euclid's_Elements_Graph.json").then(res => res.json());
  setupTheme();
  drawGraph(data.nodes, data.edges);
  setupControls();

  hideLoader();
});

// === ПОБУДОВА ГРАФА ===
function drawGraph(nodes, edges) {
  showLoader("Оновлення графа...");

  const visNodes = new vis.DataSet(nodes.map(n => ({
    id: n.id,
    label: n.id,
    title: `${n.label_uk} / ${n.label_en}`,
    shape: n.type === "construction" ? "square" : "dot",
    color: bookColor(n.bookNumber),
    font: { color: currentTheme === "dark" ? "#e0e0e0" : "#000000" }
  })));

  const visEdges = new vis.DataSet(edges);

  const container = document.getElementById("network");
  const options = {
    nodes: { shape: 'dot', size: 15 },
    edges: { arrows: 'to', color: { color: '#888' } },
    physics: { enabled: physicsEnabled },
    interaction: { hover: true }
  };

  network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, options);

  network.on("click", (params) => {
    const nodeId = params.nodes[0];
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      document.getElementById("nodeDetails").innerHTML = `
        <strong>${node.id}</strong><br/>
        🇺🇦 ${node.label_uk}<br/>
        🇬🇧 ${node.label_en}
      `;
    }
  });

  updateStats(nodes, edges);
  setTimeout(hideLoader, 300);
}

// === КОЛІР ЗА КНИГОЮ ===
function bookColor(book) {
  const palette = [
    "#1f77b4", "#2ca02c", "#ff7f0e", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
    "#bcbd22", "#17becf", "#393b79", "#637939", "#8c6d31"
  ];
  return palette[(book - 1) % palette.length];
}

// === КОНТРОЛІ ===
function setupControls() {
  document.getElementById("fitViewBtn").onclick = () => network.fit();

  document.getElementById("togglePhysicsBtn").onclick = () => {
    physicsEnabled = !physicsEnabled;
    network.setOptions({ physics: { enabled: physicsEnabled } });
  };

  document.getElementById("exportBtn").onclick = () => {
    const canvas = document.querySelector("#network canvas");
    const img = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = img;
    link.download = "euclid-graph.png";
    link.click();
  };

  document.getElementById("graphMode").onchange = (e) => {
    const mode = e.target.value;
    let filteredNodes = [];

    switch (mode) {
      case "all":
        filteredNodes = data.nodes;
        break;
      case "planimetry":
        filteredNodes = data.nodes.filter(n => n.bookNumber >= 1 && n.bookNumber <= 4);
        break;
      case "stereometry":
        filteredNodes = data.nodes.filter(n => n.bookNumber >= 11 && n.bookNumber <= 13);
        break;
      case "ratios":
        filteredNodes = data.nodes.filter(n => n.bookNumber >= 5 && n.bookNumber <= 10);
        break;
      case "plane+stereo":
        filteredNodes = data.nodes.filter(n =>
          (n.bookNumber >= 1 && n.bookNumber <= 4) ||
          (n.bookNumber >= 11 && n.bookNumber <= 13)
        );
        break;
      case "by-book":
        const book = prompt("Номер книги (1-13)?");
        filteredNodes = data.nodes.filter(n => n.bookNumber == parseInt(book));
        break;
    }

    drawGraph(filteredNodes, data.edges.filter(e => filteredNodes.find(n => n.id === e.from) && filteredNodes.find(n => n.id === e.to)));
  };

  document.getElementById("themeToggle").onclick = toggleTheme;
}

// === СТАТИСТИКА ===
function updateStats(nodes, edges) {
  const stats = {
    total: nodes.length,
    theorems: nodes.filter(n => n.type === "theorem").length,
    constructions: nodes.filter(n => n.type === "construction").length,
    books: new Set(nodes.map(n => n.bookNumber)).size,
    edges: edges.length
  };

  document.getElementById("graphStats").innerHTML = `
    🔢 Всього вузлів: ${stats.total}<br/>
    📐 Теорем: ${stats.theorems}<br/>
    🧱 Побудов: ${stats.constructions}<br/>
    📚 Книг: ${stats.books}<br/>
    🔗 Зв'язків: ${stats.edges}
  `;

  const legendEl = document.getElementById("legend");
  legendEl.innerHTML = "";
  [...new Set(nodes.map(n => n.bookNumber))].sort((a, b) => a - b).forEach(book => {
    const color = bookColor(book);
    legendEl.innerHTML += `<div><span style="display:inline-block;width:20px;height:20px;background:${color};margin-right:6px;"></span>Книга ${book}</div>`;
  });
}

// === ТЕМА ===
function setupTheme() {
  const saved = localStorage.getItem("theme") || "light";
  if (saved === "dark") {
    document.body.classList.add("dark");
    currentTheme = "dark";
  }
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", currentTheme);
}

// === LOADER ===
function showLoader(text) {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.innerText = text;
    loader.style.display = "block";
  }
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}
