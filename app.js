const TSUBO = 3.305785;
const PAGE = Object.assign(
  {
    dataUrl: "./data/bookstores.json",
    regionKey: "region",
    regions: null,
    showOrigin: false,
    colorBy: "type",
  },
  window.LEDGER_PAGE || {}
);
const SPINE_CLASS = ["spine-0", "spine-1", "spine-2", "spine-3", "spine-4"];
const CAVEAT_LABEL = {
  reduced: "フロア縮小",
  maybe_reduced: "縮小の指摘あり",
  relocated: "移転後",
};
const TYPE_LABEL = { bookstore: "書店中心", compound: "複合店" };
const ORIGIN_LABEL = { local: "地方書店", national: "全国チェーン" };

const state = {
  data: null,
  mode: "store",
  region: "all",
  chain: "all",
  type: "all",
  origin: "all",
  search: "",
};

const charts = { rank: null, region: null, chain: null };

const fmtInt = new Intl.NumberFormat("ja-JP");

function valueOf(store) {
  if (state.mode === "books") return store.books_m2;
  return store.store_m2;
}

function toTsubo(m2) {
  return Math.round(m2 / TSUBO);
}

function areaLabel(m2) {
  return `${fmtInt.format(m2)}㎡`;
}

function shortName(name) {
  return name
    .replace("MARUZEN＆ジュンク堂書店", "丸善ジュンク堂")
    .replace("ジュンク堂書店", "ジュンク堂")
    .replace("紀伊國屋書店", "紀伊國屋")
    .replace("三省堂書店", "三省堂")
    .replace("ブックセンタークエスト", "クエスト")
    .replace("ハイパーブックス", "ハイパー")
    .replace("コーチャンフォー", "コーチャン")
    .replace("蔦屋書店", "蔦屋")
    .replace("精文館書店", "精文館")
    .replace("三洋堂書店", "三洋堂")
    .replace("TSUTAYA BOOKSTORE", "TSUTAYA")
    .replace("草叢BOOKS", "草叢");
}

function filteredRows() {
  const q = state.search.trim().toLowerCase();
  return state.data.stores
    .filter((store) => {
      if (valueOf(store) == null) return false;
      if (state.region !== "all" && store[PAGE.regionKey] !== state.region) return false;
      if (state.chain !== "all" && store.chain !== state.chain) return false;
      if (state.type !== "all" && store.type !== state.type) return false;
      if (state.origin !== "all" && store.origin !== state.origin) return false;
      if (q) {
        const hay = [store.name, store.city, store.prefecture, store.chain].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => valueOf(b) - valueOf(a));
}

function uniqueChains(stores) {
  return [...new Set(stores.map((s) => s.chain))].sort((a, b) => a.localeCompare(b, "ja"));
}

function fillChainFilter() {
  const select = document.getElementById("chain-filter");
  const current = select.value;
  select.innerHTML = `<option value="all">すべて</option>` +
    uniqueChains(state.data.stores).map((c) => `<option value="${c}">${c}</option>`).join("");
  select.value = [...select.options].some((o) => o.value === current) ? current : "all";
}

function fillRegionFilter() {
  if (!PAGE.regions) return;
  const select = document.getElementById("region-filter");
  select.innerHTML =
    `<option value="all">すべて</option>` +
    PAGE.regions.map((r) => `<option value="${r}">${r}</option>`).join("");
}

function renderHeroStats(rows) {
  const allStore = state.data.stores.filter((s) => s.store_m2 != null);
  const maxStore = [...allStore].sort((a, b) => b.store_m2 - a.store_m2)[0];
  document.getElementById("stat-count").textContent = `${state.data.stores.length}店`;
  document.getElementById("stat-max").textContent = maxStore
    ? `${maxStore.name.replace(/書店|MARUZEN＆|ジュンク堂|蔦屋/g, "").trim()} ${areaLabel(maxStore.store_m2)}`
    : "—";
  const unit = state.mode === "books" ? "書籍売場" : "総売場";
  document.getElementById("result-line").textContent =
    `${rows.length}店（${unit}）。1坪 = 3.305785㎡。`;
}

function renderSpines(rows) {
  const rail = document.getElementById("spine-rail");
  const top = rows.slice(0, 12);
  if (!top.length) {
    rail.innerHTML = "<p class='hint'>該当する店舗がありません。</p>";
    return;
  }
  const max = valueOf(top[0]);
  rail.innerHTML = top
    .map((store, i) => {
      const height = 88 + (valueOf(store) / max) * 210;
      return `<button type="button" class="spine ${SPINE_CLASS[i % 5]}" style="height:${height}px" data-id="${store.id}" role="listitem" aria-label="${store.name}">
        <span class="spine-rank">${String(i + 1).padStart(2, "0")}</span>
        <span class="spine-name">${shortName(store.name)}</span>
        <span class="spine-area">${fmtInt.format(valueOf(store))}</span>
      </button>`;
    })
    .join("");
}

function chartDefaults() {
  Chart.defaults.color = "#c9bea4";
  Chart.defaults.borderColor = "rgba(243,234,214,0.12)";
  Chart.defaults.font.family = "'IBM Plex Sans JP', sans-serif";
}

function renderRankChart(rows) {
  const n = parseInt(document.getElementById("chart-n").value, 10);
  const chartRows = n > 0 ? rows.slice(0, n) : rows;
  const wrap = document.getElementById("rank-chart-wrap");
  wrap.style.height = `${Math.max(280, chartRows.length * 34 + 56)}px`;
  document.getElementById("chart-sub").textContent =
    rows.length > chartRows.length ? `（${chartRows.length} / ${rows.length}店）` : `（${chartRows.length}店）`;
  const ctx = document.getElementById("rank-chart");
  const colors = chartRows.map((s) => {
    if (PAGE.colorBy === "origin") {
      return s.origin === "local" ? "rgba(158,43,34,0.9)" : "rgba(29,61,115,0.88)";
    }
    return s.type === "compound" ? "rgba(196,122,34,0.85)" : "rgba(29,61,115,0.88)";
  });
  const data = {
    labels: chartRows.map((s) => shortName(s.name)),
    datasets: [
      {
        label: state.mode === "books" ? "書籍売場 (㎡)" : "総売場 (㎡)",
        data: chartRows.map((s) => valueOf(s)),
        backgroundColor: colors,
        borderWidth: 0,
        barThickness: 18,
      },
    ],
  };
  const options = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title(items) {
            return chartRows[items[0].dataIndex].name;
          },
          afterBody(items) {
            const store = chartRows[items[0].dataIndex];
            const extra = [];
            if (store.books_m2 && store.store_m2 !== store.books_m2) {
              extra.push(`書籍売場: ${fmtInt.format(store.books_m2)}㎡`);
            }
            extra.push(`${store.prefecture} ${store.city}`);
            if (store.caveat) extra.push(CAVEAT_LABEL[store.caveat]);
            return extra;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => fmtInt.format(v) },
        title: { display: true, text: "平方メートル" },
      },
      y: { ticks: { autoSkip: false, font: { size: 12 } } },
    },
  };
  if (charts.rank) {
    charts.rank.data = data;
    charts.rank.options = options;
    charts.rank.update();
  } else {
    charts.rank = new Chart(ctx, { type: "bar", data, options });
  }
}

function groupSum(rows, key) {
  const map = new Map();
  for (const store of rows) {
    const k = store[key];
    map.set(k, (map.get(k) || 0) + valueOf(store));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function renderGroupChart(id, key, rows) {
  const grouped = groupSum(rows, key);
  const ctx = document.getElementById(id);
  const palette = ["#1d3d73", "#9e2b22", "#2c5e48", "#c47a22", "#5c3d7a", "#4a7ea0", "#8a5a2b", "#3d6b5c"];
  const data = {
    labels: grouped.map((g) => g[0]),
    datasets: [
      {
        data: grouped.map((g) => g[1]),
        backgroundColor: grouped.map((_, i) => palette[i % palette.length]),
        borderWidth: 0,
      },
    ],
  };
  const options = {
    indexAxis: "y",
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (c) => ` ${fmtInt.format(c.parsed.x)}㎡` },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { callback: (v) => fmtInt.format(v) } },
    },
  };
  const slot = id === "region-chart" ? "region" : "chain";
  if (charts[slot]) {
    charts[slot].data = data;
    charts[slot].options = options;
    charts[slot].update();
  } else {
    ctx.parentElement.style.height = "320px";
    charts[slot] = new Chart(ctx, { type: "bar", data, options });
  }
}

function renderTable(rows) {
  const body = document.getElementById("rank-body");
  body.innerHTML = rows
    .map((store, i) => {
      const m2 = valueOf(store);
      const chips = [];
      if (store.origin) chips.push(`<span class="chip ${store.origin}">${ORIGIN_LABEL[store.origin]}</span>`);
      chips.push(`<span class="chip">${TYPE_LABEL[store.type]}</span>`);
      if (store.caveat) chips.push(`<span class="chip warn">${CAVEAT_LABEL[store.caveat]}</span>`);
      return `<tr id="row-${store.id}">
        <td class="num">${i + 1}</td>
        <td><button type="button" class="store-btn" data-id="${store.id}">${store.name}</button></td>
        <td>${store.prefecture}<br>${store.city}</td>
        <td class="num">${fmtInt.format(m2)}</td>
        <td class="num">${fmtInt.format(toTsubo(m2))}</td>
        <td>${chips.join(" ")}</td>
        <td>${store.note}</td>
      </tr>`;
    })
    .join("");
}

function openDialog(id) {
  const store = state.data.stores.find((s) => s.id === id);
  if (!store) return;
  const dialog = document.getElementById("store-dialog");
  document.getElementById("dialog-kicker").textContent = `${store.chain} / ${store.prefecture}`;
  document.getElementById("dialog-title").textContent = store.name;
  document.getElementById("dialog-facts").innerHTML = `
    <div><dt>総売場</dt><dd>${areaLabel(store.store_m2)}（${fmtInt.format(toTsubo(store.store_m2))}坪）</dd></div>
    <div><dt>書籍売場</dt><dd>${store.books_m2 ? `${areaLabel(store.books_m2)}（${fmtInt.format(toTsubo(store.books_m2))}坪）` : "未公表"}</dd></div>
    <div><dt>所在</dt><dd>${store.prefecture} ${store.city}</dd></div>
    <div><dt>フロア</dt><dd>${store.floors || "—"}</dd></div>
    <div><dt>開店</dt><dd>${store.opened || "—"}</dd></div>
    <div><dt>蔵書（公称）</dt><dd>${store.stock ? `${fmtInt.format(store.stock)}冊` : "—"}</dd></div>
  `;
  document.getElementById("dialog-note").textContent = store.note;
  document.getElementById("dialog-sources").innerHTML = store.sources
    .map((src) => `<li><a href="${src.url}" target="_blank" rel="noreferrer">${src.label}</a></li>`)
    .join("");
  dialog.hidden = false;
  document.getElementById("dialog-close").focus();
}

function closeDialog() {
  document.getElementById("store-dialog").hidden = true;
}

function render() {
  const rows = filteredRows();
  renderHeroStats(rows);
  renderSpines(rows);
  renderRankChart(rows);
  renderGroupChart("region-chart", PAGE.regionKey, rows);
  renderGroupChart("chain-chart", "chain", rows);
  renderTable(rows);
}

function bind() {
  document.getElementById("mode-seg").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    state.mode = btn.dataset.mode;
    document.querySelectorAll("#mode-seg button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    render();
  });
  document.getElementById("region-filter").addEventListener("change", (e) => {
    state.region = e.target.value;
    render();
  });
  document.getElementById("chain-filter").addEventListener("change", (e) => {
    state.chain = e.target.value;
    render();
  });
  document.getElementById("type-filter").addEventListener("change", (e) => {
    state.type = e.target.value;
    render();
  });
  document.getElementById("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });
  document.getElementById("chart-n").addEventListener("change", render);
  const originSeg = document.getElementById("origin-seg");
  if (originSeg) {
    originSeg.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      state.origin = btn.dataset.origin;
      originSeg.querySelectorAll("button").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      render();
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (btn) {
      openDialog(btn.dataset.id);
      return;
    }
    if (e.target.id === "store-dialog") closeDialog();
  });
  document.getElementById("dialog-close").addEventListener("click", closeDialog);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDialog();
  });
}

fetch(PAGE.dataUrl)
  .then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  })
  .then((data) => {
    state.data = data;
    chartDefaults();
    fillRegionFilter();
    fillChainFilter();
    bind();
    render();
  })
  .catch((err) => {
    document.getElementById("result-line").textContent = `データの読み込みに失敗しました: ${err}`;
  });
