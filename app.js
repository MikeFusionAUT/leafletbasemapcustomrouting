// Minimal Leaflet demo with basemap.at and custom routing

const map = L.map('map').setView([48.2085, 16.3729], 17);

L.tileLayer('https://maps{1-4}.wien.gv.at/basemap/bmapgrau/normal/google3857/{z}/{y}/{x}.png', {
  subdomains: ['1', '2', '3', '4'],
  maxZoom: 19,
  attribution: 'Datenquelle: <a href="https://basemap.at">basemap.at</a>'
}).addTo(map);

// nodes of the walkway network
const nodes = {
  entrance_north: [48.2085, 16.3729],
  junction: [48.2083, 16.3734],
  fountain: [48.2081, 16.3739],
  statue: [48.2082, 16.3725]
};

// undirected edges between nodes
const edges = [
  ['entrance_north', 'junction'],
  ['junction', 'fountain'],
  ['junction', 'statue']
];

// build adjacency list with distances
const graph = {};
edges.forEach(([a, b]) => {
  const dist = L.latLng(nodes[a]).distanceTo(nodes[b]);
  graph[a] = graph[a] || [];
  graph[b] = graph[b] || [];
  graph[a].push({ node: b, weight: dist });
  graph[b].push({ node: a, weight: dist });
});

// visualize the network
L.layerGroup(
  edges.map(([a, b]) => L.polyline([nodes[a], nodes[b]], { color: '#888' }))
).addTo(map);

// Dijkstra algorithm for shortest path
function shortestPath(start, end) {
  const dist = {};
  const prev = {};
  const q = new Set(Object.keys(nodes));

  Object.keys(nodes).forEach(n => (dist[n] = Infinity));
  dist[start] = 0;

  while (q.size) {
    let u = null;
    q.forEach(n => {
      if (u === null || dist[n] < dist[u]) u = n;
    });
    q.delete(u);
    if (u === end) break;
    (graph[u] || []).forEach(({ node: v, weight }) => {
      if (!q.has(v)) return;
      const alt = dist[u] + weight;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
      }
    });
  }

  const path = [];
  let u = end;
  while (u) {
    path.unshift(nodes[u]);
    u = prev[u];
  }
  return path;
}

let routeLayer = null;

function showInfo(poi) {
  const info = document.getElementById('info');
  const coord = nodes[poi.id];
  info.innerHTML = `<h2>${poi.name}</h2><p>${poi.desc}</p><p>${coord[0].toFixed(5)}, ${coord[1].toFixed(5)}</p>`;
}

function drawRoute(poi) {
  const path = shortestPath('entrance_north', poi.id);
  if (routeLayer) {
    map.removeLayer(routeLayer);
  }
  routeLayer = L.polyline(path, { color: 'red' }).addTo(map);
  map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
}

// Add start marker
L.marker(nodes.entrance_north).addTo(map).bindPopup('Eingang Nord');

const pois = [
  { id: 'fountain', name: 'Springbrunnen', desc: 'Schöner Brunnen' },
  { id: 'statue', name: 'Statue', desc: 'Berühmte Statue' }
];

pois.forEach(poi => {
  const marker = L.marker(nodes[poi.id]).addTo(map).bindPopup(poi.name);
  marker.on('click', () => {
    showInfo(poi);
    drawRoute(poi);
  });
});
