
const suppliers = [
    {
        id: 'ALU-A',
        name: 'Alu Gulf Smelters',
        city: 'Dubai',
        country: 'UAE',
        region: 'Middle East',
        material: 'Aluminium',
        product: 'Aluminium billet',
        production: 500,
        cbam: 90,
        transport: 70,
        leadTime: 28,
        risk: 42,
        emissions: 1.6,
        annualVolume: 120000,
        x: 63,
        y: 42
    },
    {
        id: 'ALU-C',
        name: 'Nordic Low Carbon Aluminium',
        city: 'Trondheim',
        country: 'Norway',
        region: 'Europe',
        material: 'Aluminium',
        product: 'Aluminium billet',
        production: 600,
        cbam: 40,
        transport: 60,
        leadTime: 12,
        risk: 18,
        emissions: 0.8,
        annualVolume: 85000,
        x: 50,
        y: 21
    },
    {
        id: 'ALU-B',
        name: 'Asia Aluminium Works',
        city: 'Busan',
        country: 'South Korea',
        region: 'Asia',
        material: 'Aluminium',
        product: 'Aluminium billet',
        production: 480,
        cbam: 140,
        transport: 100,
        leadTime: 38,
        risk: 68,
        emissions: 2.8,
        annualVolume: 140000,
        x: 82,
        y: 35
    },
    {
        id: 'STL-A',
        name: 'Anatolia Steel Mills',
        city: 'Izmir',
        country: 'Türkiye',
        region: 'Turkey',
        material: 'Steel',
        product: 'Hot rolled coil',
        production: 610,
        cbam: 115,
        transport: 55,
        leadTime: 10,
        risk: 35,
        emissions: 1.9,
        annualVolume: 220000,
        x: 55,
        y: 33
    },
    {
        id: 'STL-B',
        name: 'Korea Green Steel',
        city: 'Pohang',
        country: 'South Korea',
        region: 'Asia',
        material: 'Steel',
        product: 'Flat steel products',
        production: 640,
        cbam: 80,
        transport: 95,
        leadTime: 32,
        risk: 28,
        emissions: 1.2,
        annualVolume: 180000,
        x: 82,
        y: 37
    },
    {
        id: 'STL-C',
        name: 'Brazil Integrated Steel',
        city: 'Vitória',
        country: 'Brazil',
        region: 'South America',
        material: 'Steel',
        product: 'Semi-finished steel',
        production: 570,
        cbam: 150,
        transport: 120,
        leadTime: 40,
        risk: 55,
        emissions: 2.7,
        annualVolume: 160000,
        x: 37,
        y: 61
    }
];


const state = {
    page: 'overview',
    weights: { cost: 60, time: 25, risk: 15, co2: 15 },
    lastRanking: []
};

const el = {
    content: document.getElementById('content'),
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    searchInput: document.getElementById('searchInput'),
    materialFilter: document.getElementById('materialFilter'),
    regionFilter: document.getElementById('regionFilter'),
    contextMaterial: document.getElementById('contextMaterial'),
    refreshBtn: document.getElementById('refreshBtn'),
    exportBtn: document.getElementById('exportBtn')
};


function normalize(value, min, max) {
    if (max === min) return 0;
    return (value - min) / (max - min);
}

function totalCost(s) {
    return s.production + s.cbam + s.transport;
}

function refreshRegions() {
    const material = el.materialFilter.value;
    const current = el.regionFilter.value;
    const regions = suppliers
        .filter(s => material === 'All' || s.material === material)
        .map(s => s.region);
    const unique = ['All', ...Array.from(new Set(regions))];
    el.regionFilter.innerHTML = unique.map(r => `<option value="${r}">${r}</option>`).join('');
    el.regionFilter.value = unique.includes(current) ? current : 'All';
}

function getFiltered() {
    const material = el.materialFilter.value;
    const region = el.regionFilter.value;
    const query = el.searchInput.value.trim().toLowerCase();
    return suppliers.filter(s => {
        const materialOk = material === 'All' || s.material === material;
        const regionOk = region === 'All' || s.region === region;
        const text = `${s.name} ${s.region} ${s.material} ${s.product}`.toLowerCase();
        return materialOk && regionOk && text.includes(query);
    });
}

function getRanking() {
    const filtered = getFiltered();
    if (!filtered.length) return [];
    const costs = filtered.map(totalCost);
    const times = filtered.map(s => s.leadTime);
    const risks = filtered.map(s => s.risk);
    const co2 = filtered.map(s => s.emissions);
    const sum = state.weights.cost + state.weights.time + state.weights.risk + state.weights.co2 || 1;

    return filtered.map(s => {
        const score =
            (state.weights.cost / sum) * normalize(totalCost(s), Math.min(...costs), Math.max(...costs)) * 100 +
            (state.weights.time / sum) * normalize(s.leadTime, Math.min(...times), Math.max(...times)) * 100 +
            (state.weights.risk / sum) * normalize(s.risk, Math.min(...risks), Math.max(...risks)) * 100 +
            (state.weights.co2 / sum) * normalize(s.emissions, Math.min(...co2), Math.max(...co2)) * 100;
        return { ...s, total: totalCost(s), score: Math.round(score) };
    }).sort((a, b) => a.score - b.score);
}

function riskLevel(value) {
    if (value >= 60) return 'high';
    if (value >= 30) return 'medium';
    return 'low';
}

function co2Level(value) {
    if (value >= 2.5) return 'high';
    if (value >= 1.5) return 'medium';
    return 'low';
}

function supplierCard(s, index) {
    const best = index === 0;
    return `
        <article class="supplier-card ${best ? 'best-card' : ''}">
          ${best ? '<div class="recommended-label">Recommended</div>' : ''}
          <div class="rank-cell">${best ? '<span class="trophy">🏆</span>' : ''}<span>#${index + 1}</span></div>
          <div>
            <div class="supplier-name">${s.name}</div>
            <div class="supplier-subtitle">${s.region} · ${s.product}</div>
          </div>
          <div><div class="metric-value">${s.total}€</div><div class="metric-caption">Total €/t</div></div>
          <div><div class="metric-value">${s.leadTime} days</div><div class="metric-caption">Lead time</div></div>
          <div><div class="metric-value ${riskLevel(s.risk)}">${s.risk}/100</div><div class="metric-caption">Geo risk</div></div>
          <div><div class="metric-value ${co2Level(s.emissions)}">${s.emissions} t</div><div class="metric-caption">CO₂/t</div></div>
          <div class="card-chevron">›</div>
        </article>
      `;
}

function weightControl(key, label, icon, green) {
    const value = state.weights[key];
    return `
        <div class="weight-control">
          <div class="weight-top">
            <div class="weight-label"><span class="metric-icon ${green ? 'green' : ''}">${icon}</span>${label}</div>
            <span class="percent-pill">${value}%</span>
          </div>
          <input type="range" min="0" max="100" value="${value}" data-weight="${key}" style="--progress:${value}%" />
        </div>
      `;
}

function weightingPanel() {
    return `
        <aside class="weighting-card card">
          <div class="weighting-title">
            <span class="scale-icon">⚖</span>
            <div>
              <h2>Decision weighting</h2>
              <p class="card-text">Adjust criteria to update ranking and scores.</p>
            </div>
          </div>
          <div class="preset-grid">
            <button class="preset-btn preset-blue" data-preset="cost">Cost focus</button>
            <button class="preset-btn preset-green" data-preset="esg">ESG focus</button>
            <button class="preset-btn preset-orange" data-preset="risk">Risk focus</button>
            <button class="preset-btn preset-gray" data-preset="balanced">Balanced</button>
          </div>
          <div class="weight-controls">
            ${weightControl('cost', 'Cost', '▥', false)}
            ${weightControl('time', 'Delivery time', '◷', false)}
            ${weightControl('risk', 'Geopolitical risk', '⬟', false)}
            ${weightControl('co2', 'CO₂ emissions', '♧', true)}
          </div>
          <div class="footer-actions">
            <button class="secondary-btn" id="resetWeightsBtn">Reset weights</button>
            <div class="note"><span class="info-dot">i</span> Weights are normalized automatically for scoring.</div>
          </div>
        </aside>
      `;
}

function renderOverview(ranking) {
    const best = ranking[0];
    el.content.innerHTML = `
        <div class="overview-grid">
          <section class="recommendation-card card">
            <div class="card-header-row">
              <div>
                <h2>Top supplier recommendation</h2>
                <p class="card-text">Ranking based on current material and weighting.</p>
              </div>
              <div class="best-pill">Best: ${best ? best.name : '-'}</div>
            </div>
            <div class="ranking-list">
              ${ranking.length ? ranking.map(supplierCard).join('') : '<div class="no-results">No suppliers match the selected filters.</div>'}
            </div>
          </section>
          ${weightingPanel()}
        </div>
       
      `;
}

function renderRankingPage(ranking) {
    el.content.innerHTML = `
        <section class="table-card card">
          <h2>Supplier Ranking</h2>
          <p class="card-text">Complete ranking for the selected material, region and weighting scenario.</p>
          <br />
          ${ranking.length ? `
          <table>
            <thead>
              <tr>
                <th>Rank</th><th>Supplier</th><th>Material</th><th>Region</th><th>Total €/t</th><th>Lead time</th><th>Risk</th><th>CO₂/t</th><th>Score</th>
              </tr>
            </thead>
            <tbody>
              ${ranking.map((s, i) => `
                <tr>
                  <td><strong>#${i + 1}</strong></td>
                  <td><strong>${s.name}</strong><br><span style="color:#667085">${s.product}</span></td>
                  <td>${s.material}</td>
                  <td>${s.region}</td>
                  <td>${s.total}€</td>
                  <td>${s.leadTime} days</td>
                  <td class="${riskLevel(s.risk)}"><strong>${s.risk}/100</strong></td>
                  <td class="${co2Level(s.emissions)}"><strong>${s.emissions} t</strong></td>
                  <td><span class="score-badge">${s.score}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>` : '<div class="no-results">No suppliers match the selected filters.</div>'}
        </section>
      `;
}

function renderDetailPage(ranking) {
    el.content.innerHTML = `
        <section class="detail-grid">
          ${ranking.length ? ranking.map(s => `
            <article class="detail-card card">
              <div class="detail-title">${s.name}</div>
              <div class="detail-subtitle">${s.region} · ${s.product}</div>
              <div class="detail-row"><span>Production cost</span><strong>${s.production}€ / t</strong></div>
              <div class="detail-row"><span>CBAM cost</span><strong>${s.cbam}€ / t</strong></div>
              <div class="detail-row"><span>Transport cost</span><strong>${s.transport}€ / t</strong></div>
              <div class="detail-row"><span>Total landed cost</span><strong>${s.total}€ / t</strong></div>
              <div class="detail-row"><span>Lead time</span><strong>${s.leadTime} days</strong></div>
              <div class="detail-row"><span>Geo risk</span><strong class="${riskLevel(s.risk)}">${s.risk}/100</strong></div>
              <div class="detail-row"><span>CO₂ emissions</span><strong class="${co2Level(s.emissions)}">${s.emissions} t / t</strong></div>
            </article>
          `).join('') : '<div class="no-results">No suppliers match the selected filters.</div>'}
        </section>
      `;
}

function renderScenarioPage(ranking) {
    const best = ranking[0];
    el.content.innerHTML = `
        <section>
          <div class="scenario-grid">
            <article class="scenario-card card" data-preset="cost"><div class="scenario-title">Cost focus</div><div class="scenario-desc">Prioritizes total landed cost and keeps ESG/risk constraints lighter.</div></article>
            <article class="scenario-card card" data-preset="esg"><div class="scenario-title">ESG focus</div><div class="scenario-desc">Prioritizes lower CO₂ emissions for sustainability-oriented sourcing.</div></article>
            <article class="scenario-card card" data-preset="risk"><div class="scenario-title">Risk focus</div><div class="scenario-desc">Prioritizes geopolitical risk and supply continuity.</div></article>
            <article class="scenario-card card" data-preset="balanced"><div class="scenario-title">Balanced</div><div class="scenario-desc">Distributes weight more evenly across cost, time, risk and CO₂.</div></article>
          </div>
          <section class="recommendation-card card">
            <div class="card-header-row">
              <div>
                <h2>Scenario result</h2>
                <p class="card-text">Current scenario recommends the best supplier based on the active weights.</p>
              </div>
              <div class="best-pill">Best: ${best ? best.name : '-'}</div>
            </div>
            <div class="ranking-list">
              ${ranking.length ? ranking.map(supplierCard).join('') : '<div class="no-results">No suppliers match the selected filters.</div>'}
            </div>
          </section>
        </section>
      `;
}

function setPageText() {
    const map = {
        overview: ['Overview', 'Interactive Fiori-style clickable mock-up for CBAM, transport, cost, CO₂ and risk steering.'],
        ranking: ['Supplier Ranking', 'Full supplier ranking with score, cost, lead time, risk and carbon impact.'],
        detail: ['Supplier Detail', 'Supplier-level view with production, CBAM, transport, risk and emissions KPIs.'],
        scenario: ['Scenario Simulation', 'Apply sourcing scenarios and compare how the recommendation changes.'],
        map: ['Map Overview', 'Global geopolitical risk and supplier exposure visualization.']

    };
    el.pageTitle.textContent = map[state.page][0];
    el.pageSubtitle.textContent = map[state.page][1];
}

function bindDynamicEvents() {
    document.querySelectorAll('[data-weight]').forEach(input => {
        input.addEventListener('input', e => {
            const key = e.target.dataset.weight;
            state.weights[key] = Number(e.target.value);
            render();
        });
    });

    document.querySelectorAll('[data-preset]').forEach(btn => {
        btn.addEventListener('click', e => applyPreset(e.currentTarget.dataset.preset));
    });

    const resetBtn = document.getElementById('resetWeightsBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetWeights);
}

function render() {
    refreshRegions();
    setPageText();
    el.contextMaterial.textContent = el.materialFilter.value;
    const ranking = getRanking();
    state.lastRanking = ranking;

    if (state.page === 'overview') renderOverview(ranking);
    if (state.page === 'ranking') renderRankingPage(ranking);
    if (state.page === 'detail') renderDetailPage(ranking);
    if (state.page === 'scenario') renderScenarioPage(ranking);
    if (state.page === 'map') renderMapPage();


    bindDynamicEvents();
}

function applyPreset(preset) {
    if (preset === 'cost') state.weights = { cost: 70, time: 15, risk: 10, co2: 5 };
    if (preset === 'esg') state.weights = { cost: 35, time: 15, risk: 10, co2: 40 };
    if (preset === 'risk') state.weights = { cost: 35, time: 20, risk: 35, co2: 10 };
    if (preset === 'balanced') state.weights = { cost: 40, time: 20, risk: 20, co2: 20 };
    render();
}

function resetWeights() {
    state.weights = { cost: 60, time: 25, risk: 15, co2: 15 };
    render();
}

function exportCsv() {
    const ranking = state.lastRanking.length ? state.lastRanking : getRanking();
    const rows = [
        ['Rank', 'Supplier', 'Material', 'Product', 'Region', 'Production', 'CBAM', 'Transport', 'Total', 'Lead Time', 'Risk', 'CO2', 'Score'],
        ...ranking.map((s, i) => [i + 1, s.name, s.material, s.product, s.region, s.production, s.cbam, s.transport, s.total, s.leadTime, s.risk, s.emissions, s.score])
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cbam-supplier-ranking.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// function renderMapPage() {

//     el.content.innerHTML = `

//     <section class="card risk-map-card">

//       <div class="card-header-row">

//         <div>
//           <h2>Global Risk Monitor</h2>
//           <p class="card-text">
//             Geopolitical sourcing exposure based on active suppliers.
//           </p>
//         </div>

//         <div class="best-pill">
//           Highest Risk: Asia
//         </div>

//       </div>


// <div class="world-map">

//   <img
//     src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
//     class="map-image"
//   />

//   <div class="hotspot europe">
//       🟢
//   </div>

//   <div class="hotspot turkey">
//       🟡
//   </div>

//   <div class="hotspot asia">
//       ⚡
//   </div>

// </div>



// <div class="risk-summary-row">

//     <div class="summary-box">
//         <div class="summary-value">68</div>
//         <div class="summary-label">
//             Highest Risk Score
//         </div>
//     </div>

//     <div class="summary-box">
//         <div class="summary-value">
//             Asia
//         </div>
//         <div class="summary-label">
//             Risk Region
//         </div>
//     </div>

//     <div class="summary-box">
//         <div class="summary-value">
//             Asia Aluminium Works
//         </div>
//         <div class="summary-label">
//             Affected Supplier
//         </div>
//     </div>

// </div>




//     </section>

//   `;
// }



// function renderMapPage() {

//     el.content.innerHTML = `

//     <section class="card risk-map-card">

//       <div class="card-header-row">

//         <div>
//           <h2>Global Risk Exposure</h2>
//           <p class="card-text">
//             Dynamic geopolitical risk visualization
//           </p>
//         </div>

//         <div class="best-pill">
//           Highest Risk: Asia
//         </div>

//       </div>

//       <div class="risk-heatmap">

//         <div class="risk-region europe">
//           <div class="region-name">Europe</div>
//           <div class="region-score">18</div>
//           <div class="region-status">Low Risk</div>
//         </div>

//         <div class="risk-region turkey">
//           <div class="region-name">Turkey</div>
//           <div class="region-score">35</div>
//           <div class="region-status">Medium Risk</div>
//         </div>

//         <div class="risk-region asia">
//           <div class="region-name">Asia ⚡</div>
//           <div class="region-score">68</div>
//           <div class="region-status">High Risk</div>
//         </div>

//       </div>

//     </section>

//   `;
// }


// function renderMapPage() {

//     const material = el.materialFilter.value;

//     let riskRegion = "Asia";
//     let riskScore = 68;
//     let supplier = "Asia Aluminium Works";

//     if (material === "Steel") {
//         riskRegion = "Turkey";
//         riskScore = 55;
//         supplier = "Anatolia Steel Mills";
//     }

//     el.content.innerHTML = `

//     <section class="card risk-map-card">

//       <div class="card-header-row">

//         <div>
//           <h2>Global Risk Monitor</h2>
//           <p class="card-text">
//             Geopolitical sourcing exposure based on active suppliers.
//           </p>
//         </div>

//         <div class="best-pill">
//           Highest Risk: ${riskRegion}
//         </div>

//       </div>

//       <div class="world-map">

//         <img
//           src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
//           class="map-image"
//           alt="World Map"
//         />

//       </div>

//       <div class="risk-summary-row">

//         <div class="summary-box">

//           <div class="summary-value">
//             ${riskScore}
//           </div>

//           <div class="summary-label">
//             Highest Risk Score
//           </div>

//         </div>

//         <div class="summary-box">

//           <div class="summary-value">
//             ${riskRegion}
//           </div>

//           <div class="summary-label">
//             Risk Region
//           </div>

//         </div>

//         <div class="summary-box">

//           <div class="summary-value" style="font-size:18px">
//             ${supplier}
//           </div>

//           <div class="summary-label">
//             Affected Supplier
//           </div>

//         </div>

//       </div>

//     </section>

//   `;
// }


// function riskMapTile() {
//     return `
//     <section class="risk-map-card card">

//       <div class="risk-map-header">
//         <h2>Global Risk Monitor</h2>

//         <span class="risk-badge">
//           High Exposure
//         </span>
//       </div>


// <div class="world-map">

// <svg
//     viewBox="0 0 1000 450"
//     width="100%"
//     height="100%"
// >

//     <!-- North America -->
//     <path
//         d="M90 120 L210 80 L250 130 L220 190 L140 200 L80 170 Z"
//         fill="#dce8f7"
//     />

//     <!-- South America -->
//     <path
//         d="M220 240 L280 270 L260 390 L200 350 Z"
//         fill="#dce8f7"
//     />

//     <!-- Europe -->
//     <ellipse
//         cx="480"
//         cy="130"
//         rx="60"
//         ry="35"
//         fill="#22c55e"
//     />

//     <!-- Africa -->
//     <path
//         d="M470 180 L550 200 L530 340 L460 300 Z"
//         fill="#dce8f7"
//     />

//     <!-- Asia -->
//     <path
//         d="M560 110
//            L760 90
//            L850 150
//            L810 240
//            L640 230
//            L570 170 Z"
//         fill="#ef4444"
//     />

//     <!-- Australia -->
//     <ellipse
//         cx="800"
//         cy="330"
//         rx="70"
//         ry="35"
//         fill="#dce8f7"
//     />

// </svg>

// <div class="map-label europe-label">
//     Europe
// </div>

// <div class="map-label asia-label">
//     Asia
// </div>

// <div class="map-label turkey-label">
//     Turkey
// </div>

// <div class="risk-hotspot">
//     ⚡
// </div>

// </div>

// <div class="risk-legend">

//     <span class="legend-item">
//         🟢 Low Risk
//     </span>

//     <span class="legend-item">
//         🟡 Medium Risk
//     </span>

//     <span class="legend-item">
//         🔴 High Risk
//     </span>

// </div>


//       <div class="risk-summary">

//         <div class="risk-item danger">
//           ⚡ Asia Aluminium Works
//         </div>

//         <div class="risk-score">
//           Risk Score: 68 / 100
//         </div>

//       </div>

//     </section>
//   `;
// }


const rotterdam = {
    name: 'Rotterdam',
    x: 50,
    y: 29
};

function getRiskColor(value) {
    if (value >= 60) return '#dc2626';
    if (value >= 30) return '#f59e0b';
    return '#16a34a';
}

function getCO2Color(value) {
    if (value >= 2.5) return '#dc2626';
    if (value >= 1.5) return '#f59e0b';
    return '#16a34a';
}

function getLineWidth(volume) {
    if (volume >= 200000) return 0.75;
    if (volume >= 150000) return 0.58;
    if (volume >= 100000) return 0.45;
    return 0.35;
}

function createRouteCurve(supplier) {
    const x1 = supplier.x;
    const y1 = supplier.y;
    const x2 = rotterdam.x;
    const y2 = rotterdam.y;

    const middleX = (x1 + x2) / 2;

    let middleY = Math.min(y1, y2) - Math.abs(x1 - x2) * 0.22;

    if (supplier.region === 'South America') {
        middleY = 44;
    }

    if (supplier.region === 'Middle East') {
        middleY = 34;
    }

    if (supplier.region === 'Turkey') {
        middleY = 31;
    }

    if (supplier.region === 'Europe') {
        middleY = 20;
    }

    return `M ${x1} ${y1} Q ${middleX} ${middleY} ${x2} ${y2}`;
}

function formatVolume(value) {
    return `${Math.round(value / 1000)}k t`;
}

function renderMapPage() {
    const filtered = getFiltered();

    const highestRiskSupplier = filtered.length
        ? [...filtered].sort((a, b) => b.risk - a.risk)[0]
        : null;

    const totalVolume = filtered.reduce((sum, s) => sum + s.annualVolume, 0);

    const materialLabel = el.materialFilter.value === 'All'
        ? 'Alu / Steel'
        : el.materialFilter.value;

    el.content.innerHTML = `

    <section class="card risk-map-card">

      <div class="card-header-row">

        <div>
          <h2>CBAM Supplier Network</h2>
          <p class="card-text">
            Transport flows to Europe hub Rotterdam.
          </p>
        </div>

        <div class="best-pill">
          Highest Risk: ${highestRiskSupplier ? highestRiskSupplier.region : '-'}
        </div>

      </div>

      <div class="map-kpi-row">

        <div class="map-kpi-card">
          <div class="map-kpi-label">Suppliers</div>
          <div class="map-kpi-value">${filtered.length}</div>
        </div>

        <div class="map-kpi-card">
          <div class="map-kpi-label">Destination</div>
          <div class="map-kpi-value">Rotterdam</div>
        </div>

        <div class="map-kpi-card">
          <div class="map-kpi-label">Materials</div>
          <div class="map-kpi-value">${materialLabel}</div>
        </div>

        <div class="map-kpi-card">
          <div class="map-kpi-label">Total Volume</div>
          <div class="map-kpi-value">${Math.round(totalVolume / 1000)}k t</div>
        </div>

      </div>

      <div class="world-map">

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"
          class="map-image"
          alt="World Map"
        />

        <div class="map-explainer">
          Points = supplier locations | Lines = transport flows to Rotterdam |
          Point color = CO₂ intensity | Line color = geopolitical risk |
          Line width = annual volume
        </div>

        <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">

          ${filtered.map(s => `
            <path
              d="${createRouteCurve(s)}"
              fill="none"
              stroke="${getRiskColor(s.risk)}"
              stroke-width="${getLineWidth(s.annualVolume)}"
              stroke-linecap="round"
              opacity="0.86"
            />
          `).join('')}

        </svg>

        <div
          class="map-rotterdam"
          style="left:${rotterdam.x}%; top:${rotterdam.y}%"
        >
          <div class="rotterdam-star">★</div>
          <div class="rotterdam-box">
            EU Hub<br />
            Rotterdam
          </div>
        </div>

        ${filtered.map(s => `
          <div
            class="map-supplier"
            style="left:${s.x}%; top:${s.y}%"
            title="${s.name}"
          >
            <div
              class="map-dot ${s.material === 'Steel' ? 'steel' : 'aluminium'}"
              style="background:${getCO2Color(s.emissions)}"
            ></div>

            <div class="map-label">
              ${s.id}<br />
              ${s.city}
            </div>
          </div>
        `).join('')}

        <div class="map-legend">

          <div class="legend-box">
            <div class="legend-title">Locations</div>

            <div class="legend-row">
              <span class="legend-symbol circle"></span>
              Aluminium supplier
            </div>

            <div class="legend-row">
              <span class="legend-symbol square"></span>
              Steel supplier
            </div>

            <div class="legend-row">
              <span class="legend-symbol star">★</span>
              Rotterdam EU Hub
            </div>
          </div>

          <div class="legend-box">
            <div class="legend-title">CO₂ / Risk</div>

            <div class="legend-row">
              <span class="legend-color low"></span>
              Low
            </div>

            <div class="legend-row">
              <span class="legend-color medium"></span>
              Medium
            </div>

            <div class="legend-row">
              <span class="legend-color high"></span>
              High
            </div>
          </div>

        </div>

        <div class="map-table-box">

          <table class="map-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Location</th>
                <th>Material</th>
                <th>Vol.</th>
                <th>CO₂</th>
                <th>Risk</th>
              </tr>
            </thead>

    
<tbody>
  ${filtered.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${s.city}</td>
      <td>${s.material}</td>
      <td>${formatVolume(s.annualVolume)}</td>
      <td>${s.emissions}</td>
      <td>${s.risk}</td>
    </tr>
  `).join('')}
</tbody>

          </table >

        </div >

      </div >

    <div class="risk-summary-row">

        <div class="summary-box">
            <div class="summary-value">
                ${highestRiskSupplier ? highestRiskSupplier.risk : '-'}
            </div>
            <div class="summary-label">
                Highest Risk Score
            </div>
        </div>

        <div class="summary-box">
            <div class="summary-value">
                ${highestRiskSupplier ? highestRiskSupplier.region : '-'}
            </div>
            <div class="summary-label">
                Risk Region
            </div>
        </div>

        <div class="summary-box">
            <div class="summary-value" style="font-size:18px">
                ${highestRiskSupplier ? highestRiskSupplier.name : '-'}
            </div>
            <div class="summary-label">
                Affected Supplier
            </div>
        </div>

    </div>

    </section >

    `;
}


document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        state.page = btn.dataset.page;
        render();
    });
});

el.searchInput.addEventListener('input', render);
el.materialFilter.addEventListener('change', () => {
    el.regionFilter.value = 'All';
    render();
});
el.regionFilter.addEventListener('change', render);
el.refreshBtn.addEventListener('click', render);
el.exportBtn.addEventListener('click', exportCsv);

render();