/*
 * BI interativo com dados fictícios (ghost data).
 * Expõe window.BI.open(dashboard) — usado pelos cards de dashboards da landing page.
 * Os números são gerados de forma determinística a partir do id do BI + filtros,
 * então o mesmo filtro sempre mostra os mesmos valores.
 */
(function () {
  "use strict";

  /* Paleta categórica (validada para fundo escuro, 3 primeiras posições). */
  const CAT = ["#3987e5", "#d95926", "#199e70"];
  const GOOD = "#34d399";
  const BAD = "#f87171";
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Utilidades ---------- */
  const hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const rng = (seedStr) => {
    let a = hash(seedStr);
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const nf = (d) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmt = (v, kind, compact = true) => {
    switch (kind) {
      case "brl": {
        const a = Math.abs(v);
        if (compact && a >= 1e6) return `R$ ${nf(1).format(v / 1e6)} mi`;
        if (compact && a >= 1e4) return `R$ ${nf(0).format(v / 1e3)} mil`;
        return `R$ ${nf(a >= 1000 ? 0 : 2).format(v)}`;
      }
      case "pct": return `${nf(1).format(v)}%`;
      case "x": return `${nf(1).format(v)}x`;
      case "dias": return `${nf(1).format(v)} dias`;
      default:
        if (compact && Math.abs(v) >= 1e4) return `${nf(1).format(v / 1e3)} mil`;
        return nf(0).format(v);
    }
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const svg = (tag, attrs = {}) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const countUp = (node, to, kind, ms = 900) => {
    if (reduceMotion) { node.textContent = fmt(to, kind); return; }
    const from = Number(node.dataset.v || 0);
    node.dataset.v = to;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(from + (to - from) * e, kind);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabels = () => {
    const now = new Date();
    const out = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
      out.push(`${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`);
    }
    return out;
  };

  /* ---------- Tooltip compartilhado ---------- */
  const tip = el("div", "viz-tip");
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  const showTip = (x, y, title, rows) => {
    tip.replaceChildren();
    tip.appendChild(el("div", "viz-tip__title", title));
    rows.forEach((r) => {
      const row = el("div", "viz-tip__row");
      const key = el("i");
      key.style.background = r.color;
      if (r.dashed) key.classList.add("is-dashed");
      row.append(key, el("strong", null, r.value), el("span", null, r.label));
      tip.appendChild(row);
    });
    tip.classList.add("is-on");
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tip.style.transform = `translate(${left}px, ${top}px)`;
  };
  const hideTip = () => tip.classList.remove("is-on");

  /* ---------- Geração de ghost data ---------- */
  function generate(d, st) {
    const f = d.full;
    const key = `${d.id}|${st.filter}`;
    const r0 = rng(key + "|scale");
    const filterScale = st.filter === 0 ? 1 : 0.18 + r0() * 0.32;
    const months = monthLabels();

    // Quebra por categoria (cross-filter)
    const rb = rng(key + "|breakdown");
    const breakdown = f.breakdown.items
      .map((name) => ({ name, value: f.breakdown.base * filterScale * (0.35 + rb() * 0.95) }))
      .sort((a, b) => b.value - a.value);
    const bTotal = breakdown.reduce((s, x) => s + x.value, 0);
    const sel = st.selected != null ? breakdown.find((x) => x.name === st.selected) : null;
    const selShare = sel ? sel.value / bTotal : 1;
    const selKey = key + "|" + (st.selected || "*");

    // Série temporal
    const rt = rng(selKey + "|trend");
    const trendAll = months.map((m, i) => {
      const base = f.trend.base * filterScale * selShare;
      const actual = base * (0.86 + i * 0.016 + (rt() - 0.5) * 0.14);
      const target = base * (0.93 + i * 0.011);
      return { label: m, actual, target };
    });
    const trend = trendAll.slice(12 - st.period);
    const periodScale = st.period / 12;

    // KPIs
    const rk = rng(selKey + "|" + st.period + "|kpi");
    const kpis = f.kpis.map((k) => {
      const value = k.agg === "sum"
        ? k.base * filterScale * selShare * periodScale * (0.96 + rk() * 0.08)
        : k.base * (1 + (rk() - 0.5) * (st.filter || st.selected ? 0.1 : 0.02));
      const delta = (rk() - 0.38) * 14;
      const good = k.lowerIsBetter ? delta < 0 : delta >= 0;
      return { ...k, value, delta, good };
    });

    // Participação (3 categorias)
    const rs = rng(selKey + "|share");
    const w = f.share.items.map(() => 0.4 + rs());
    const wSum = w.reduce((a, b) => a + b, 0);
    const share = f.share.items.map((name, i) => ({ name, value: w[i] / wSum, color: CAT[i] }));

    // Tabela
    const rr = rng(selKey + "|" + st.period + "|table");
    const table = f.table.items.map((name) => {
      const real = f.table.base * filterScale * selShare * periodScale * (0.45 + rr());
      const meta = real * (0.88 + rr() * 0.22);
      return { name, real, meta, varPct: (real / meta - 1) * 100 };
    });

    return { kpis, trend, breakdown, share, table };
  }

  /* ---------- Componentes ---------- */
  function renderKpis(root, data, accent) {
    if (!root.children.length) {
      data.kpis.forEach(() => {
        const card = el("div", "bi-kpi");
        card.style.setProperty("--accent", accent);
        card.append(el("small"), el("strong"), el("span", "bi-kpi__delta"));
        root.appendChild(card);
      });
    }
    data.kpis.forEach((k, i) => {
      const card = root.children[i];
      card.children[0].textContent = k.label;
      countUp(card.children[1], k.value, k.fmt);
      const dl = card.children[2];
      dl.textContent = `${k.delta >= 0 ? "▲" : "▼"} ${nf(1).format(Math.abs(k.delta))}% vs. período anterior`;
      dl.className = "bi-kpi__delta " + (k.good ? "is-good" : "is-bad");
    });
  }

  function renderTrend(root, data, f, accent) {
    root.replaceChildren();
    const W = Math.max(280, root.clientWidth), H = 240;
    const m = { t: 12, r: 12, b: 26, l: 64 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const pts = data.trend;
    const max = Math.max(...pts.map((p) => Math.max(p.actual, p.target))) * 1.08;
    const x = (i) => m.l + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
    const y = (v) => m.t + ih - (v / max) * ih;

    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: "bi-svg", role: "img", "aria-label": f.trend.title });
    const defs = svg("defs");
    const gid = "g" + Math.random().toString(36).slice(2, 8);
    const grad = svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.append(svg("stop", { offset: "0%", "stop-color": accent, "stop-opacity": 0.28 }), svg("stop", { offset: "100%", "stop-color": accent, "stop-opacity": 0 }));
    defs.appendChild(grad);
    s.appendChild(defs);

    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      s.appendChild(svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: "bi-grid" }));
      const t = svg("text", { x: m.l - 8, y: y(v) + 4, class: "bi-axis", "text-anchor": "end" });
      t.textContent = i === 0 ? "0" : fmt(v, f.trend.fmt);
      s.appendChild(t);
    }
    const every = pts.length > 6 ? 2 : 1;
    pts.forEach((p, i) => {
      if (i % every) return;
      const t = svg("text", { x: x(i), y: H - 6, class: "bi-axis", "text-anchor": "middle" });
      t.textContent = p.label;
      s.appendChild(t);
    });

    const line = (key) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");
    const area = svg("path", { d: `${line("actual")}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z`, fill: `url(#${gid})`, class: "bi-area" });
    const target = svg("path", { d: line("target"), class: "bi-line bi-line--target" });
    const actual = svg("path", { d: line("actual"), class: "bi-line bi-line--draw", stroke: accent, pathLength: 1 });
    s.append(area, target, actual);

    const lastI = pts.length - 1;
    s.appendChild(svg("circle", { cx: x(lastI), cy: y(pts[lastI].actual), r: 4, fill: accent, class: "bi-end" }));

    // Crosshair
    const hair = svg("line", { y1: m.t, y2: m.t + ih, class: "bi-hair" });
    const dotA = svg("circle", { r: 5, fill: accent, class: "bi-hair-dot" });
    const dotT = svg("circle", { r: 4, class: "bi-hair-dot bi-hair-dot--target" });
    s.append(hair, dotA, dotT);
    const hit = svg("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent" });
    s.appendChild(hit);
    const move = (ev) => {
      const box = s.getBoundingClientRect();
      const px = ((ev.clientX - box.left) / box.width) * W;
      const i = Math.max(0, Math.min(lastI, Math.round(((px - m.l) / iw) * lastI)));
      const p = pts[i];
      s.classList.add("is-hover");
      hair.setAttribute("x1", x(i)); hair.setAttribute("x2", x(i));
      dotA.setAttribute("cx", x(i)); dotA.setAttribute("cy", y(p.actual));
      dotT.setAttribute("cx", x(i)); dotT.setAttribute("cy", y(p.target));
      showTip(ev.clientX, ev.clientY, p.label, [
        { color: accent, value: fmt(p.actual, f.trend.fmt, false), label: "Realizado" },
        { color: "#94a3b8", dashed: true, value: fmt(p.target, f.trend.fmt, false), label: f.trend.target }
      ]);
    };
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", () => { s.classList.remove("is-hover"); hideTip(); });
    root.appendChild(s);
  }

  function renderBreakdown(root, data, f, accent, st, onSelect) {
    const max = Math.max(...data.breakdown.map((b) => b.value));
    const existing = new Map([...root.children].map((n) => [n.dataset.name, n]));
    root.replaceChildren();
    data.breakdown.forEach((b, i) => {
      let row = existing.get(b.name);
      if (!row) {
        row = el("button", "bi-bar");
        row.type = "button";
        row.dataset.name = b.name;
        row.append(el("span", "bi-bar__label"), el("span", "bi-bar__track"), el("span", "bi-bar__value"));
        row.children[1].appendChild(el("i"));
        row.addEventListener("click", () => onSelect(b.name));
        row.addEventListener("pointerleave", hideTip);
      }
      row.onpointermove = (ev) => showTip(ev.clientX, ev.clientY, b.name, [
        { color: accent, value: fmt(b.value, f.breakdown.fmt, false), label: "Clique para filtrar" }
      ]);
      row.children[0].textContent = b.name;
      row.children[2].textContent = fmt(b.value, f.breakdown.fmt);
      const fill = row.children[1].firstChild;
      fill.style.background = accent;
      fill.style.transitionDelay = `${i * 50}ms`;
      row.classList.toggle("is-dim", st.selected != null && st.selected !== b.name);
      row.classList.toggle("is-on", st.selected === b.name);
      row.setAttribute("aria-pressed", st.selected === b.name);
      root.appendChild(row);
      setTimeout(() => { fill.style.width = `${(b.value / max) * 100}%`; }, 30);
    });
  }

  function renderShare(root, data, f) {
    root.replaceChildren();
    const size = 168, r = 62, sw = 22, C = 2 * Math.PI * r;
    const s = svg("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size, class: "bi-donut", role: "img", "aria-label": f.share.title });
    const g = svg("g", { transform: `rotate(-90 ${size / 2} ${size / 2})` });
    let acc = 0;
    const gap = 2.5;
    data.share.forEach((p, i) => {
      const len = Math.max(0, p.value * C - gap);
      const c = svg("circle", {
        cx: size / 2, cy: size / 2, r, fill: "none", stroke: p.color, "stroke-width": sw,
        "stroke-dasharray": `0 ${C}`, "stroke-dashoffset": -acc, class: "bi-donut__seg"
      });
      c.addEventListener("pointermove", (ev) => showTip(ev.clientX, ev.clientY, p.name, [
        { color: p.color, value: `${nf(1).format(p.value * 100)}%`, label: "do total" }
      ]));
      c.addEventListener("pointerleave", hideTip);
      g.appendChild(c);
      setTimeout(() => c.setAttribute("stroke-dasharray", `${len} ${C - len}`), reduceMotion ? 0 : 60 + i * 120);
      acc += p.value * C;
    });
    s.appendChild(g);
    const center = svg("text", { x: size / 2, y: size / 2 + 6, "text-anchor": "middle", class: "bi-donut__center" });
    center.textContent = `${nf(0).format(data.share[0].value * 100)}%`;
    const sub = svg("text", { x: size / 2, y: size / 2 + 24, "text-anchor": "middle", class: "bi-axis" });
    sub.textContent = data.share[0].name;
    s.append(center, sub);

    const legend = el("ul", "bi-legend");
    data.share.forEach((p) => {
      const li = el("li");
      const sw2 = el("i");
      sw2.style.background = p.color;
      li.append(sw2, el("span", null, p.name), el("strong", null, `${nf(1).format(p.value * 100)}%`));
      legend.appendChild(li);
    });
    root.append(s, legend);
  }

  function renderTable(root, data, f) {
    root.replaceChildren();
    const t = el("table", "bi-table");
    const thead = el("thead");
    const hr = el("tr");
    f.table.cols.forEach((c) => hr.appendChild(el("th", null, c)));
    thead.appendChild(hr);
    const tb = el("tbody");
    data.table.forEach((row, i) => {
      const tr = el("tr");
      tr.style.animationDelay = `${i * 45}ms`;
      tr.append(
        el("td", null, row.name),
        el("td", "num", fmt(row.real, f.table.fmt)),
        el("td", "num", fmt(row.meta, f.table.fmt))
      );
      const v = el("td", "num " + (row.varPct >= 0 ? "is-good" : "is-bad"),
        `${row.varPct >= 0 ? "▲" : "▼"} ${nf(1).format(Math.abs(row.varPct))}%`);
      tr.appendChild(v);
      tb.appendChild(tr);
    });
    t.append(thead, tb);
    root.appendChild(t);
  }

  const toCSV = (d, data) => {
    const f = d.full;
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [f.table.cols.map(q).join(";")];
    data.table.forEach((r) => lines.push([r.name, r.real.toFixed(2), r.meta.toFixed(2), r.varPct.toFixed(2)].map(q).join(";")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = el("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.id}-dados-ficticios.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ---------- Modal ---------- */
  let modal, lastFocus;

  function buildShell() {
    modal = el("div", "bi-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="bi-modal__backdrop" data-close></div>
      <div class="bi-frame">
        <header class="bi-top">
          <div class="bi-top__title">
            <span class="bi-top__logo" aria-hidden="true"></span>
            <div><h3 id="bi-title"></h3><small id="bi-sub"></small></div>
          </div>
          <span class="bi-ghost mono">● dados fictícios</span>
          <button class="bi-close" type="button" aria-label="Fechar" data-close>✕</button>
        </header>
        <div class="bi-toolbar">
          <div class="bi-slicer" id="bi-filter"></div>
          <div class="bi-slicer" id="bi-period"></div>
          <button type="button" class="bi-clear" id="bi-clear" hidden>✕ limpar seleção</button>
          <button type="button" class="bi-export" id="bi-export">⭳ Exportar CSV</button>
        </div>
        <div class="bi-body">
          <div class="bi-kpis" id="bi-kpis"></div>
          <div class="bi-grid">
            <section class="bi-panel bi-panel--wide"><h4 id="bi-trend-title"></h4>
              <ul class="bi-legend bi-legend--inline" id="bi-trend-legend"></ul>
              <div id="bi-trend" class="bi-chart"></div></section>
            <section class="bi-panel"><h4 id="bi-bd-title"></h4><p class="bi-hint">Clique em uma barra para filtrar o painel inteiro</p><div id="bi-bd" class="bi-bars"></div></section>
            <section class="bi-panel"><h4 id="bi-share-title"></h4><div id="bi-share" class="bi-share"></div></section>
            <section class="bi-panel bi-panel--wide"><h4 id="bi-table-title"></h4><div id="bi-table" class="bi-table-wrap"></div></section>
          </div>
        </div>
        <div class="bi-loader" aria-hidden="true">
          <div class="bi-loader__bars"><i></i><i></i><i></i><i></i></div>
          <span class="mono">carregando modelo semântico…</span>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  function slicer(root, label, options, active, onPick) {
    root.replaceChildren(el("span", "bi-slicer__label", label));
    const group = el("div", "bi-slicer__group");
    options.forEach((o, i) => {
      const b = el("button", "bi-chip" + (i === active ? " is-active" : ""), o.label ?? o);
      b.type = "button";
      b.setAttribute("aria-pressed", i === active);
      b.addEventListener("click", () => onPick(i));
      group.appendChild(b);
    });
    root.appendChild(group);
  }

  function open(d) {
    if (!d.full) return;
    if (!modal) buildShell();
    lastFocus = document.activeElement;
    const f = d.full;
    const accent = d.accent;
    const st = { filter: 0, period: 12, selected: null };
    const PERIODS = [{ label: "3M", v: 3 }, { label: "6M", v: 6 }, { label: "12M", v: 12 }];

    modal.style.setProperty("--accent", accent);
    modal.querySelector("#bi-title").textContent = d.title;
    modal.querySelector("#bi-sub").textContent = `${d.category} · ${d.tools.join(" · ")}`;
    modal.querySelector("#bi-trend-title").textContent = f.trend.title;
    modal.querySelector("#bi-bd-title").textContent = f.breakdown.title;
    modal.querySelector("#bi-share-title").textContent = f.share.title;
    modal.querySelector("#bi-table-title").textContent = f.table.title;
    modal.querySelector("#bi-kpis").replaceChildren();
    modal.querySelector("#bi-bd").replaceChildren();

    const leg = modal.querySelector("#bi-trend-legend");
    leg.replaceChildren();
    [["Realizado", accent, false], [f.trend.target, "#94a3b8", true]].forEach(([n, c, dashed]) => {
      const li = el("li");
      const k = el("i", dashed ? "is-dashed" : "");
      k.style.background = c;
      li.append(k, el("span", null, n));
      leg.appendChild(li);
    });

    let data;
    const render = () => {
      data = generate(d, st);
      slicer(modal.querySelector("#bi-filter"), f.filter.label, f.filter.options, st.filter, (i) => { st.filter = i; st.selected = null; render(); });
      slicer(modal.querySelector("#bi-period"), "Período", PERIODS, PERIODS.findIndex((p) => p.v === st.period), (i) => { st.period = PERIODS[i].v; render(); });
      const clear = modal.querySelector("#bi-clear");
      clear.hidden = st.selected == null;
      clear.textContent = st.selected ? `✕ ${st.selected}` : "";
      renderKpis(modal.querySelector("#bi-kpis"), data, accent);
      renderTrend(modal.querySelector("#bi-trend"), data, f, accent);
      renderBreakdown(modal.querySelector("#bi-bd"), data, f, accent, st, (name) => {
        st.selected = st.selected === name ? null : name;
        render();
      });
      renderShare(modal.querySelector("#bi-share"), data, f);
      renderTable(modal.querySelector("#bi-table"), data, f);
    };

    modal.querySelector("#bi-clear").onclick = () => { st.selected = null; render(); };
    modal.querySelector("#bi-export").onclick = () => toCSV(d, data);

    modal.classList.remove("is-ready");
    modal.classList.add("is-open");
    document.documentElement.classList.add("bi-lock");
    modal.querySelector(".bi-close").focus({ preventScroll: true });

    setTimeout(() => {
      modal.classList.add("is-ready");
      render();
    }, reduceMotion ? 0 : 650);

    let raf;
    window.onresize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (modal.classList.contains("is-ready")) renderTrend(modal.querySelector("#bi-trend"), data, f, accent);
      });
    };
  }

  function close() {
    hideTip();
    modal.classList.remove("is-open", "is-ready");
    document.documentElement.classList.remove("bi-lock");
    window.onresize = null;
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  window.BI = { open, fmt };
})();
