/*
 * BIs de demonstração no padrão Torre de Controle.
 * Expõe window.Report.open(dashboard).
 *
 * Cada BI gera uma base fictícia determinística (mesma semente = mesmos números) e todos os visuais
 * calculam a partir dela, como num modelo de verdade: filtros, cross-filter e totais sempre batem.
 */
(function () {
  "use strict";

  const C = {
    blue: "#0B72D7", blueLight: "#54B5FB", cyan: "#00DDFF", soft: "#A8D4F5",
    grey: "#B0B8C4", muted: "#6B7A8D", green: "#00FF18", red: "#FF5C7A", yellow: "#C8D400"
  };
  const SLICE = [C.blue, C.blueLight, C.cyan, C.soft, C.muted];
  const KPI_COLORS = [C.blueLight, C.cyan, C.blue, C.soft];
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const W = 1280, H = 720;
  const PAGES = ["main", "analysis", "detail"];
  const ZOOM = typeof CSS !== "undefined" && CSS.supports && CSS.supports("zoom", "2");

  /* ---------------- utilidades ---------------- */
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const rng = (seed) => { let a = hash(seed); return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const nfc = {};
  const nf = (d) => nfc[d] || (nfc[d] = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }));
  const compact = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return nf(1).format(v / 1e6) + " mi";
    if (a >= 1e4) return nf(1).format(v / 1e3) + "k";
    return nf(0).format(v);
  };
  const fmt = (v, kind, full) => {
    if (v == null || !isFinite(v)) return "s/ dado";
    switch (kind) {
      case "brl": return full ? "R$ " + nf(2).format(v) : (Math.abs(v) >= 1e4 ? "R$ " + compact(v) : "R$ " + nf(Math.abs(v) < 100 ? 2 : 0).format(v));
      case "pct": return nf(1).format(v) + "%";
      case "x": return nf(2).format(v) + "x";
      case "dias": return nf(1).format(v) + " dias";
      default: return full ? nf(0).format(v) : (Math.abs(v) >= 1e4 ? compact(v) : nf(0).format(v));
    }
  };
  const pad = (n) => String(n).padStart(2, "0");
  const dBR = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const dISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const mKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const mLabel = (d) => `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
  const day0 = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);

  const h = (tag, attrs, ...kids) => {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "style") n.style.cssText = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(c)); });
    return n;
  };
  const NS = "http://www.w3.org/2000/svg";
  const s = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  const countTo = (node, from, to, kind, ms = 900) => {
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      node.textContent = fmt(from + (to - from) * easeOut(k), kind);
      if (k < 1) requestAnimationFrame(step); else node.textContent = fmt(to, kind);
    };
    requestAnimationFrame(step);
  };

  /* ---------------- base fictícia ---------------- */
  const cache = {};
  function buildModel(d) {
    if (cache[d.id]) return cache[d.id];
    const R = d.report;
    const r = rng(d.id + "|rows");
    const today = day0(new Date());
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const m0 = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const last = i === 0 ? today.getDate() : new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
      const dim = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
      months.push({ key: mKey(m0), label: mLabel(m0), date: m0, days: last, daysInMonth: dim, partial: i === 0 });
    }
    const mW = months.map((m, i) => (1 + i * 0.035) * (0.9 + r() * 0.22) * (m.days / m.daysInMonth));
    const pick = (weights) => {
      const tot = weights.reduce((a, b) => a + b, 0);
      let x = r() * tot;
      for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x <= 0) return i; }
      return weights.length - 1;
    };
    const dimW = {};
    for (const k in R.dims) {
      const dm = R.dims[k];
      dimW[k] = dm.weights || dm.values.map((_, i) => (1 / Math.pow(i + 1, 0.75)) * (0.75 + r() * 0.5));
    }
    const rows = [];
    for (let i = 0; i < R.rows; i++) {
      const mi = pick(mW), m = months[mi];
      let date = new Date(m.date.getFullYear(), m.date.getMonth(), 1 + Math.floor(r() * m.days));
      // fim de semana tem bem menos movimento, como numa operação real
      for (let t = 0; t < 3 && (date.getDay() === 0 || date.getDay() === 6) && r() < 0.72; t++) {
        date = new Date(m.date.getFullYear(), m.date.getMonth(), 1 + Math.floor(r() * m.days));
      }
      const row = { id: `${R.idPrefix}-${String(10000 + i * 7 + Math.floor(r() * 7)).padStart(6, "0")}`, date, mk: m.key, n: {} };
      for (const k in R.dims) row[k] = R.dims[k].values[pick(dimW[k])];
      R.nums.forEach((nm) => {
        let v;
        if (nm.gen) v = nm.gen[0] + (nm.gen[1] - nm.gen[0]) * Math.pow(r(), 1.5);
        else v = row.n[nm.from] * (nm.mult[0] + (nm.mult[1] - nm.mult[0]) * r());
        if (nm.round || nm.fmt === "int") v = Math.max(nm.round ? 0 : 1, Math.round(v));
        row.n[nm.key] = v;
      });
      rows.push(row);
    }
    rows.sort((a, b) => b.date - a.date);
    return (cache[d.id] = { rows, months, today, min: months[0].date, max: today });
  }

  /* ---------------- cálculo ---------------- */
  function kpiValues(R, rows) {
    const out = [];
    const match = (row, where) => { for (const k in where) if (row[k] !== where[k]) return false; return true; };
    R.kpis.forEach((k, i) => {
      let v;
      const sub = k.where ? rows.filter((x) => match(x, k.where)) : rows;
      switch (k.calc) {
        case "count": v = rows.length; break;
        case "sum": v = sub.reduce((a, x) => a + x.n[k.field], 0); break;
        case "avg": v = sub.length ? sub.reduce((a, x) => a + x.n[k.field], 0) / sub.length : null; break;
        case "pct": v = rows.length ? (sub.length / rows.length) * 100 : null; break;
        case "sub": v = out[k.a] - out[k.b]; break;
        case "div": v = out[k.b] ? (out[k.a] / out[k.b]) * (k.pct ? 100 : 1) : null; break;
        case "divField": {
          const den = rows.reduce((a, x) => a + x.n[k.den], 0);
          v = den ? rows.reduce((a, x) => a + x.n[k.num], 0) / den : null;
          break;
        }
      }
      out[i] = v;
    });
    return out;
  }
  const kpiOf = (R, rows, idx) => kpiValues(R, rows)[idx];

  /* ---------------- estado e filtros ---------------- */
  const freshState = (M) => ({
    page: "main",
    from: M.min, to: M.max, range: "all",
    f: new Set(), cat: new Set(), ent: new Set(), st: new Set(),
    sel: { month: null, cat: new Set(), ent: new Set() },
    search: "", entSearch: "", sort: { key: "data", dir: -1 }, showAll: false
  });

  function filtered(M, st, skip = {}) {
    return M.rows.filter((x) => {
      if (x.date < st.from || x.date > st.to) return false;
      if (!skip.f && st.f.size && !st.f.has(x.f)) return false;
      if (!skip.cat && st.cat.size && !st.cat.has(x.cat)) return false;
      if (!skip.ent && st.ent.size && !st.ent.has(x.ent)) return false;
      if (!skip.st && st.st.size && !st.st.has(x.st)) return false;
      if (!skip.selMonth && st.sel.month && x.mk !== st.sel.month) return false;
      if (!skip.selCat && st.sel.cat.size && !st.sel.cat.has(x.cat)) return false;
      if (!skip.selEnt && st.sel.ent.size && !st.sel.ent.has(x.ent)) return false;
      return true;
    });
  }

  /* ---------------- tooltip ---------------- */
  let tip;
  const showTip = (ev, title, lines) => {
    if (!tip) { tip = h("div", { class: "rpt-tip", role: "tooltip" }); document.body.append(tip); }
    tip.replaceChildren(h("div", { class: "rpt-tip__t", text: title }),
      ...lines.map(([k, v, cls]) => h("div", { class: "rpt-tip__r" }, h("span", { text: k }), h("strong", { class: cls || "", text: v }))));
    tip.classList.add("is-on");
    const w = tip.offsetWidth, hh = tip.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY - hh - 12;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y < 8) y = ev.clientY + 16;
    tip.style.transform = `translate(${x}px,${y}px)`;
  };
  const hideTip = () => tip && tip.classList.remove("is-on");
  const tipOn = (el, fn) => {
    el.addEventListener("pointermove", (e) => { const t = fn(); showTip(e, t[0], t[1]); });
    el.addEventListener("pointerleave", hideTip);
  };

  /* ---------------- relatório ---------------- */
  let modal, ctx;

  // linhas com todos os filtros, menos os de data (para comparar meses)
  const baseRows = (M, st, skipSelCat) => M.rows.filter((x) => (!st.f.size || st.f.has(x.f)) && (!st.cat.size || st.cat.has(x.cat)) &&
    (!st.ent.size || st.ent.has(x.ent)) && (!st.st.size || st.st.has(x.st)) &&
    (skipSelCat || !st.sel.cat.size || st.sel.cat.has(x.cat)) && (!st.sel.ent.size || st.sel.ent.has(x.ent)));

  function deltaInfo(R, M, st, idx, k) {
    // último mês completo vs anterior, com os filtros que não são de data
    const base = baseRows(M, st);
    const a = M.months[10], b = M.months[9];
    const va = kpiOf(R, base.filter((x) => x.mk === a.key), idx);
    const vb = kpiOf(R, base.filter((x) => x.mk === b.key), idx);
    if (va == null || vb == null || !vb) return null;
    const isRate = ["pct", "x", "dias"].includes(k.fmt) || ["avg", "div", "divField", "pct"].includes(k.calc);
    const delta = isRate && k.fmt === "pct" ? va - vb : ((va - vb) / Math.abs(vb)) * 100;
    const good = k.lowerIsBetter ? delta <= 0 : delta >= 0;
    const unit = isRate && k.fmt === "pct" ? " p.p." : "%";
    return { text: `${delta >= 0 ? "▲" : "▼"} ${nf(1).format(Math.abs(delta))}${unit}`, label: `vs ${fmt(vb, k.fmt)}`, period: `${a.label} vs ${b.label}`, good };
  }

  const EXPAND_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  const COLLAPSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
  function card(title, sub, i, extraClass, expandable) {
    const head = h("div", { class: "rc__head" }, h("div", { class: "rc__titles" }, h("h4", { text: title }), sub ? h("small", { text: sub }) : null));
    const el = h("section", { class: "rc a-fade " + (extraClass || ""), style: `--i:${i}` }, head);
    if (expandable) {
      const btn = h("button", { type: "button", class: "rc__expand", "aria-label": "Expandir visual", title: "Expandir" });
      btn.innerHTML = EXPAND_SVG;
      btn.addEventListener("click", (e) => { e.stopPropagation(); toggleExpand(el, btn); });
      head.append(btn);
    }
    return el;
  }
  function toggleExpand(el, btn) {
    const on = !el.classList.contains("is-expanded");
    const pg = el.closest(".pg");
    pg.querySelectorAll(".rc.is-expanded").forEach((x) => { x.classList.remove("is-expanded"); const b = x.querySelector(".rc__expand"); if (b) b.innerHTML = EXPAND_SVG; });
    if (on) { el.classList.add("is-expanded"); btn.innerHTML = COLLAPSE_SVG; btn.setAttribute("aria-label", "Recolher visual"); }
    else btn.setAttribute("aria-label", "Expandir visual");
    pg.classList.toggle("has-expanded", on);
  }

  /* ----- header ----- */
  function header(d, R, M, st) {
    const count = h("strong", { class: "rh__count", text: "0" });
    const period = h("strong");
    const idx = PAGES.indexOf(st.page);
    const navBtn = (dir, label, path) => {
      const b = h("button", { type: "button", class: "rh__nav", "aria-label": label, title: label, disabled: (dir < 0 ? idx <= 0 : idx >= PAGES.length - 1) ? "" : null });
      b.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); const n = PAGES[idx + dir]; if (n) go(n); });
      return b;
    };
    const chips = h("div", { class: "rh__filters" });
    const el = h("header", { class: "rh a-fade", style: "--i:0" },
      h("div", { class: "rh__logo", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
      h("div", { class: "rh__title" }, h("h3", { text: d.title }), h("small", { text: R.subtitle })),
      chips,
      h("div", { class: "rh__chips" }, h("span", { class: "rh__chip" }, "Período ", period), h("span", { class: "rh__chip rh__chip--count" }, count, " " + R.unit),
        navBtn(-1, "Página anterior", "M15 18l-6-6 6-6"), navBtn(1, "Próxima página", "M9 18l6-6-6-6")));
    return { el, count, period, chips, last: 0 };
  }

  function renderHeader(c) {
    const { R, st, hd } = c;
    hd.period.textContent = `${dBR(st.from)} – ${dBR(st.to)}`;
    const n = c.rows.length;
    countTo(hd.count, hd.last, n, "int", 700);
    hd.last = n;
    // filtro do cabeçalho (dimensão f)
    hd.chips.replaceChildren(h("span", { class: "rh__flabel", text: R.dims.f.label }),
      ...R.dims.f.values.map((v) => h("button", {
        type: "button", class: "pill" + (st.f.has(v) ? " is-on" : ""), text: v,
        onclick: (e) => { e.stopPropagation(); toggle(st.f, v, e); update(); }
      })));
  }

  const toggle = (set, v, e) => {
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey)) { set.has(v) ? set.delete(v) : set.add(v); return; }
    if (set.has(v) && set.size === 1) set.clear(); else { set.clear(); set.add(v); }
  };

  /* ----- ticker ----- */
  function renderTicker(c) {
    const { R, M, st } = c;
    const rows = filtered(M, st, { selEnt: true });
    const a = M.months[10].key, b = M.months[9].key;
    const items = R.dims.ent.values.map((name) => {
      const mine = rows.filter((x) => x.ent === name);
      const va = kpiOf(R, mine.filter((x) => x.mk === a), R.ranking.kpi) || 0;
      const vb = kpiOf(R, mine.filter((x) => x.mk === b), R.ranking.kpi) || 0;
      return { name, va, delta: vb ? ((va - vb) / vb) * 100 : null };
    }).filter((x) => x.va > 0).sort((x, y) => y.va - x.va).slice(0, 10);
    const k = R.kpis[R.ranking.kpi];
    const mk = (it) => {
      const up = it.delta == null || it.delta >= 0;
      const good = k.lowerIsBetter ? !up : up;
      const el = h("button", {
        type: "button", class: "tk__item" + (st.sel.ent.size && !st.sel.ent.has(it.name) ? " is-dim" : ""),
        onclick: (e) => { e.stopPropagation(); toggle(st.sel.ent, it.name, e); update(); }
      }, h("span", { class: "tk__name", text: it.name }), h("strong", { text: fmt(it.va, k.fmt) }),
        it.delta == null ? null : h("em", { class: good ? "is-good" : "is-bad", text: `${up ? "▲" : "▼"} ${nf(1).format(Math.abs(it.delta))}%` }));
      tipOn(el, () => [it.name, [[`${M.months[10].label}`, fmt(it.va, k.fmt, true)], ["vs mês anterior", it.delta == null ? "s/ dado" : `${it.delta >= 0 ? "+" : ""}${nf(1).format(it.delta)}%`], ["Clique", "filtra o painel"]]]);
      return el;
    };
    const track = h("div", { class: "tk__track" }, items.map(mk), items.map(mk));
    c.ticker.replaceChildren(h("span", { class: "tk__label", text: `Top 10 · ${M.months[10].label}` }), h("div", { class: "tk__viewport" }, track));
  }

  /* ----- KPIs ----- */
  function renderKpis(c, animate) {
    const { R, M, st } = c;
    const vals = kpiValues(R, c.rows);
    c.spark = null;
    c.kpiBox.replaceChildren(...R.kpis.map((k, i) => {
      const v = vals[i];
      const valEl = h("strong", { class: "kp__v", text: animate ? fmt(0, k.fmt) : fmt(v, k.fmt) });
      const dl = deltaInfo(R, M, st, i, k);
      const extra = [];
      if (k.pacing) {
        const plan = c.rows.reduce((a, x) => a + x.n[k.pacing.plan], 0);
        const pct = plan ? (v / plan) * 100 : 0;
        const over = pct > 110;
        extra.push(h("div", { class: "kp__pace" },
          h("div", { class: "kp__track" },
            h("i", { class: "kp__fill" + (over ? " is-warn" : ""), style: `--w:${Math.min(pct, 125) / 1.25}%` }),
            h("b", { class: "kp__mark", style: "left:80%", title: "100%" }), h("b", { class: "kp__mark kp__mark--warn", style: "left:88%", title: "110%" })),
          h("span", { class: over ? "is-warn" : "", text: `Pacing ${nf(0).format(pct)}% do orçamento${over ? " · acima de 110%" : ""}` })));
      }
      if (k.target != null && v != null) {
        const bad = k.rule === "min" ? v < k.target : v > k.target;
        extra.push(h("span", { class: "kp__pill " + (bad ? "is-bad" : "is-good"), text: `${bad ? "Fora da meta" : "Dentro da meta"} · meta ${fmt(k.target, k.fmt)}` }));
      }
      // mini tendência dos 11 meses completos
      const base = c.spark || (c.spark = baseRows(M, st));
      const series = M.months.slice(0, 11).map((m) => kpiOf(R, base.filter((x) => x.mk === m.key), i));
      const vals2 = series.filter((x) => x != null);
      let spark = null;
      if (vals2.length > 2) {
        const lo = Math.min(...vals2), hi = Math.max(...vals2), sw = 104, sh = 30;
        const pts = series.map((y, j) => [(j / (series.length - 1)) * sw, y == null ? sh : sh - ((y - lo) / (hi - lo || 1)) * (sh - 4) - 2]);
        const d = pts.map(([x, y], j) => `${j ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
        const svgEl = s("svg", { viewBox: `0 0 ${sw} ${sh}`, class: "kp__spark", "aria-hidden": "true" });
        svgEl.append(s("path", { d: `${d} L${sw} ${sh} L0 ${sh} Z`, class: "kp__spark-area" }), s("path", { d, class: "kp__spark-line", pathLength: 1 }),
          s("circle", { cx: pts[pts.length - 1][0], cy: pts[pts.length - 1][1], r: 2.6, class: "kp__spark-dot" }));
        spark = svgEl;
      }
      const el = h("div", { class: "kp a-fade", style: `--i:${i + 1};--c:${KPI_COLORS[i]}` },
        h("small", { class: "kp__l", text: k.label }), valEl,
        h("span", { class: "kp__ctx", text: st.range === "all" ? "últimos 12 meses" : "no período filtrado" }),
        ...extra,
        dl ? h("span", { class: "kp__d" }, h("b", { class: dl.good ? "is-good" : "is-bad", text: dl.text }), " " + dl.label) : null,
        k.pacing ? null : spark);
      if (animate) countTo(valEl, 0, v || 0, k.fmt);
      tipOn(el, () => {
        const mv = kpiOf(R, c.rows.filter((x) => x.mk === M.months[11].key), i);
        return [k.label, [["Total no filtro", fmt(v, k.fmt, true)], [`${M.months[11].label} (parcial)`, fmt(mv, k.fmt, true)], ["Variação", dl ? `${dl.text} ${dl.label}` : "s/ dado"], ["Comparação", dl ? dl.period : "s/ dado"]]];
      });
      return el;
    }));
  }

  /* ----- tendência mensal ----- */
  function renderTrend(c) {
    const { R, M, st } = c;
    const k = R.kpis[R.trend.kpi];
    const rows = filtered(M, st, { selMonth: true });
    const data = M.months.map((m) => {
      const mr = rows.filter((x) => x.mk === m.key);
      const inRange = m.date <= st.to && new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0) >= st.from;
      return { m, v: inRange && mr.length ? kpiOf(R, mr, R.trend.kpi) : null };
    });
    const max = Math.max(1, ...data.map((x) => x.v || 0));
    const maxI = data.findIndex((x) => x.v === max);
    const full = data.filter((x) => x.v != null && !x.m.partial);
    const avg = full.length ? full.reduce((a, x) => a + x.v, 0) / full.length : null;
    const box = h("div", { class: "tr" });
    if (avg) box.append(h("div", { class: "tr__avg", style: `--r:${avg / max}` }, h("span", { text: `média ${fmt(avg, k.fmt)}` })));
    data.forEach((x, i) => {
      const pct = x.v ? (x.v / max) * 100 : 0;
      const dim = st.sel.month && st.sel.month !== x.m.key;
      const prev = i ? data[i - 1].v : null;
      const col = h("button", {
        type: "button", class: "tr__col" + (dim ? " is-dim" : "") + (x.m.partial ? " is-partial" : "") + (i === maxI ? " is-max" : "") + (st.sel.month === x.m.key ? " is-sel" : ""),
        onclick: (e) => { e.stopPropagation(); if (!x.v) return; st.sel.month = st.sel.month === x.m.key ? null : x.m.key; update(); }
      },
        h("span", { class: "tr__val", text: x.v == null ? "s/ dado" : (i === maxI || x.m.partial || st.sel.month === x.m.key ? fmt(x.v, k.fmt) : "") }),
        h("span", { class: "tr__bar a-growy", style: `--h:${Math.max(pct, x.v ? 2 : 0)}%;--i:${i}` }),
        h("span", { class: "tr__lbl", text: x.m.label.split("/")[0] + (x.m.partial ? "*" : "") }));
      tipOn(col, () => [x.m.label + (x.m.partial ? " (mês parcial)" : ""), x.v == null ? [["Valor", "s/ dado"]] : [
        [k.label, fmt(x.v, k.fmt, true)],
        ["vs mês anterior", prev ? `${x.v >= prev ? "▲" : "▼"} ${nf(1).format(Math.abs((x.v / prev - 1) * 100))}%` : "s/ dado"],
        ["vs média", avg ? `${x.v >= avg ? "▲" : "▼"} ${nf(1).format(Math.abs((x.v / avg - 1) * 100))}%` : "s/ dado"],
        ...(["count", "sum"].includes(k.calc) ? [["Média por dia", fmt(x.v / x.m.days, k.fmt, true)]] : []),
        ["Clique", "filtra o mês"]
      ]]);
      box.append(col);
    });
    c.trendBody.replaceChildren(box, h("p", { class: "rc__note", text: "* mês parcial · maior valor em destaque · linha tracejada = média dos meses completos" }));
  }

  /* ----- rosca com "Outros" ----- */
  function renderShare(c, animate) {
    const { R, M, st } = c;
    const k = R.kpis[R.share.kpi];
    const rows = filtered(M, st, { selCat: true });
    let items = R.dims.cat.values.map((name) => ({ name, names: [name], v: kpiOf(R, rows.filter((x) => x.cat === name), R.share.kpi) || 0 }))
      .filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    if (items.length > 5) {
      const rest = items.slice(4);
      items = items.slice(0, 4).concat({ name: "Outros", names: rest.map((x) => x.name), v: rest.reduce((a, x) => a + x.v, 0), others: rest.length });
    }
    const tot = items.reduce((a, x) => a + x.v, 0);
    const size = 150, r = 56, sw = 20, Cc = 2 * Math.PI * r;
    const svg = s("svg", { viewBox: `0 0 ${size} ${size}`, class: "sh__donut", role: "img", "aria-label": R.share.title });
    const g = s("g", { transform: `rotate(-90 ${size / 2} ${size / 2})` });
    g.append(s("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: "rgba(84,181,251,.08)", "stroke-width": sw }));
    const t1 = s("text", { x: size / 2, y: size / 2 + 2, "text-anchor": "middle", class: "sh__total" });
    t1.textContent = fmt(tot, k.fmt);
    const t2 = s("text", { x: size / 2, y: size / 2 + 18, "text-anchor": "middle", class: "sh__sub" });
    t2.textContent = "total";
    let acc = 0;
    const isSel = (it) => !st.sel.cat.size || it.names.some((n) => st.sel.cat.has(n));
    const pick = (it, e) => {
      e.stopPropagation();
      const same = it.names.length === st.sel.cat.size && it.names.every((n) => st.sel.cat.has(n));
      if (!(e.ctrlKey || e.metaKey) || same) st.sel.cat.clear();
      if (!same) it.names.forEach((n) => st.sel.cat.add(n));
      update();
    };
    items.forEach((it, i) => {
      const len = tot ? (it.v / tot) * Cc : 0;
      const seg = Math.max(0, len - 2);
      const color = it.name === "Outros" ? C.muted : SLICE[i];
      const cEl = s("circle", { cx: size / 2, cy: size / 2, r, fill: "none", stroke: color, "stroke-width": sw, "stroke-dashoffset": -acc, class: "sh__seg" + (isSel(it) ? "" : " is-dim") });
      cEl.style.strokeDasharray = animate ? `0 ${Cc}` : `${seg} ${Cc - seg}`;
      if (animate) setTimeout(() => { cEl.style.strokeDasharray = `${seg} ${Cc - seg}`; }, 250 + i * 180);
      cEl.addEventListener("click", (e) => pick(it, e));
      cEl.addEventListener("pointerenter", () => { t1.textContent = nf(1).format((it.v / tot) * 100) + "%"; t2.textContent = it.name; svg.classList.add("is-hover"); cEl.classList.add("is-hot"); });
      cEl.addEventListener("pointerleave", () => { t1.textContent = fmt(tot, k.fmt); t2.textContent = "total"; svg.classList.remove("is-hover"); cEl.classList.remove("is-hot"); });
      tipOn(cEl, () => [it.name, [[k.label, fmt(it.v, k.fmt, true)], ["Participação", nf(1).format((it.v / tot) * 100) + "%"], ...(it.others ? [["Reúne", `${it.others} categorias`]] : [])]]);
      g.append(cEl);
      acc += len;
    });
    svg.append(g, t1, t2);
    const legend = h("ul", { class: "sh__legend" }, items.map((it, i) => h("li", {
      class: "a-in" + (isSel(it) ? "" : " is-dim"), style: `--i:${i}`, onclick: (e) => pick(it, e)
    }, h("i", { style: `background:${it.name === "Outros" ? C.muted : SLICE[i]}` }), h("span", { text: it.name + (it.others ? ` (${it.others})` : "") }),
      h("strong", { text: tot ? nf(1).format((it.v / tot) * 100) + "%" : "0%" }))));
    const top = items[0];
    const insight = top ? `${top.name} concentra ${nf(0).format((top.v / tot) * 100)}% ${R.share.kpi === R.trend.kpi ? "do total" : "do valor"}${items.some((x) => x.others) ? `. "Outros" reúne ${items[items.length - 1].others} categorias menores.` : "."}` : "Nenhum dado no contexto filtrado.";
    c.shareBody.replaceChildren(h("div", { class: "sh" }, svg, legend), h("p", { class: "sh__insight", text: insight }));
  }

  /* ----- ranking ----- */
  function renderRanking(c) {
    const { R, M, st } = c;
    const k = R.kpis[R.ranking.kpi];
    const rows = filtered(M, st, { selEnt: true });
    const all = R.dims.ent.values.map((name) => ({ name, v: kpiOf(R, rows.filter((x) => x.ent === name), R.ranking.kpi) || 0 }))
      .filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    const tot = all.reduce((a, x) => a + x.v, 0);
    const max = all.length ? all[0].v : 1;
    const fit = c.fluid ? 8 : 7;
    const list = h("ol", { class: "rk" }, all.slice(0, fit).map((x, i) => {
      const li = h("li", {
        class: "rk__row a-in" + (st.sel.ent.size && !st.sel.ent.has(x.name) ? " is-dim" : ""), style: `--i:${i}`,
        onclick: (e) => { e.stopPropagation(); toggle(st.sel.ent, x.name, e); update(); }
      }, h("span", { class: "rk__pos", text: String(i + 1) }),
        h("span", { class: "rk__name", text: x.name }),
        h("span", { class: "rk__track" }, h("i", { class: "a-growx" + (i === 0 ? " is-max" : ""), style: `--w:${(x.v / max) * 100}%;--i:${i}` })),
        h("strong", { class: "rk__v", text: fmt(x.v, k.fmt) }));
      tipOn(li, () => [`${i + 1}º · ${x.name}`, [[k.label, fmt(x.v, k.fmt, true)], ["Participação", nf(1).format((x.v / tot) * 100) + "%"], ["Clique", "filtra o painel"]]]);
      return li;
    }));
    const more = all.length > fit ? h("button", {
      type: "button", class: "rc__more", title: "Ver a lista completa na página Detalhe",
      onclick: (e) => { e.stopPropagation(); go("detail"); }
    }, `+ ${all.length - fit} outros`, h("span", { "aria-hidden": "true", text: "›" })) : null;
    c.rankBody.replaceChildren(all.length ? list : h("p", { class: "rc__empty", text: "Nenhum dado no contexto filtrado" }), more);
  }

  /* ----- página de detalhe: filtros ----- */
  function chipFilter(c, key, i) {
    const { R, M, st } = c;
    const dm = R.dims[key];
    const rows = filtered(M, st, { [key]: true });
    const box = card(dm.label, null, i, "rf");
    const group = h("div", { class: "rf__chips" }, dm.values.map((v) => {
      const n = rows.filter((x) => x[key] === v).length;
      return h("button", {
        type: "button", class: "pill" + (st[key].has(v) ? " is-on" : "") + (n ? "" : " is-zero"),
        onclick: (e) => { e.stopPropagation(); toggle(st[key], v, e); update(); }
      }, v, h("em", { text: nf(0).format(n) }));
    }));
    box.append(group);
    return box;
  }

  function dateFilter(c, i) {
    const { M, st } = c;
    const box = card("Período", null, i, "rf rf--date");
    const mk = (val, min, max, on) => h("input", { type: "date", value: dISO(val), min: dISO(min), max: dISO(max), onchange: on });
    const parse = (v) => { const [y, m, dd] = v.split("-").map(Number); return new Date(y, m - 1, dd); };
    const from = mk(st.from, M.min, M.max, (e) => { if (e.target.value) { st.from = parse(e.target.value); st.range = "custom"; update(); } });
    const to = mk(st.to, M.min, M.max, (e) => { if (e.target.value) { st.to = parse(e.target.value); st.range = "custom"; update(); } });
    const T = M.today;
    const shortcuts = [
      ["7d", "7 dias", () => [new Date(T.getFullYear(), T.getMonth(), T.getDate() - 6), T]],
      ["30d", "30 dias", () => [new Date(T.getFullYear(), T.getMonth(), T.getDate() - 29), T]],
      ["mes", "Mês", () => [new Date(T.getFullYear(), T.getMonth(), 1), T]],
      ["ant", "Mês ant.", () => [new Date(T.getFullYear(), T.getMonth() - 1, 1), new Date(T.getFullYear(), T.getMonth(), 0)]],
      ["all", "Tudo", () => [M.min, M.max]]
    ];
    box.append(h("div", { class: "rf__dates" }, h("label", null, "De", from), h("label", null, "Até", to)),
      h("div", { class: "rf__chips" }, shortcuts.map(([id, label, fn]) => h("button", {
        type: "button", class: "pill" + (st.range === id ? " is-on" : ""), text: label,
        onclick: (e) => { e.stopPropagation(); [st.from, st.to] = fn(); st.range = id; st.sel.month = null; update(); }
      }))));
    return box;
  }

  function listFilter(c, i) {
    const { R, M, st } = c;
    const rows = filtered(M, st, { ent: true, selEnt: true });
    const counts = R.dims.ent.values.map((v) => ({ v, n: rows.filter((x) => x.ent === v).length })).sort((a, b) => b.n - a.n);
    const max = Math.max(1, ...counts.map((x) => x.n));
    const box = card(R.dims.ent.label, `${counts.length} itens`, i, "rf rf--list");
    const search = h("input", { type: "search", class: "rf__search", placeholder: "Buscar…", value: st.entSearch });
    const ul = h("ul", { class: "rf__list" });
    const paint = () => {
      const q = st.entSearch.toLowerCase();
      ul.replaceChildren(...counts.filter((x) => x.v.toLowerCase().includes(q)).map((x) => h("li", {
        class: (st.ent.has(x.v) ? "is-on" : "") + (st.ent.size && !st.ent.has(x.v) ? " is-dim" : ""),
        onclick: (e) => { e.stopPropagation(); toggle(st.ent, x.v, e); update(); }
      }, h("span", { class: "rf__check" }), h("span", { class: "rf__name", text: x.v }), h("em", { text: nf(0).format(x.n) }),
        h("i", { class: "rf__vol", style: `--w:${(x.n / max) * 100}%` }))));
    };
    search.addEventListener("input", () => { st.entSearch = search.value; paint(); });
    search.addEventListener("click", (e) => e.stopPropagation());
    paint();
    box.append(search, ul);
    return box;
  }

  /* ----- página de detalhe: tabela ----- */
  function colsOf(R) {
    return R.table.map((key) => {
      if (key === "data") return { key, label: "Data", get: (x) => x.date, show: (x) => dBR(x.date) };
      if (key === "id") return { key, label: "ID", get: (x) => x.id, show: (x) => x.id };
      if (R.dims[key]) return { key, label: R.dims[key].label, get: (x) => x[key], show: (x) => x[key], dim: true };
      const nm = R.nums.find((n) => n.key === key);
      return { key, label: nm.label, get: (x) => x.n[key], show: (x) => fmt(x.n[key], nm.fmt, true), num: true };
    });
  }

  function tableRows(c) {
    const { st } = c;
    const cols = colsOf(c.R);
    const q = st.search.trim().toLowerCase();
    let rows = c.rows;
    if (q) rows = rows.filter((x) => cols.some((col) => String(col.show(x)).toLowerCase().includes(q)));
    const col = cols.find((x) => x.key === st.sort.key) || cols[0];
    return rows.slice().sort((a, b) => { const va = col.get(a), vb = col.get(b); return (va > vb ? 1 : va < vb ? -1 : 0) * st.sort.dir; });
  }

  function renderTable(c, animate) {
    const { R, st } = c;
    const cols = colsOf(R);
    const rows = tableRows(c);
    const limit = st.showAll ? Math.min(rows.length, 500) : (c.fluid ? 12 : 7);
    const thead = h("thead", null, h("tr", null, cols.map((col) => h("th", {
      class: (col.num ? "num" : "") + (st.sort.key === col.key ? " is-sorted" : ""),
      onclick: (e) => { e.stopPropagation(); st.sort = { key: col.key, dir: st.sort.key === col.key ? -st.sort.dir : (col.num || col.key === "data" ? -1 : 1) }; renderTable(c, true); }
    }, col.label, st.sort.key === col.key ? (st.sort.dir < 0 ? " ▼" : " ▲") : ""))));
    const tbody = h("tbody", null, rows.slice(0, limit).map((x, i) => h("tr", { class: animate ? "a-row" : "", style: `--i:${Math.min(i, 30)}` },
      cols.map((col) => {
        const td = h("td", { class: (col.num ? "num" : "") + (col.dim ? " is-link" : "") });
        if (col.key === "st") {
          const tones = R.dims.st.tones || ["good", "warn", "bad"];
          td.append(h("span", { class: "badge badge--" + (tones[R.dims.st.values.indexOf(x.st)] || "info"), text: x.st }));
        } else td.textContent = col.show(x);
        if (col.dim) td.addEventListener("click", (e) => { e.stopPropagation(); toggle(st[col.key], x[col.key], e); update(); });
        return td;
      }))));
    const table = h("table", { class: "tb" }, thead, tbody);
    c.tableWrap.replaceChildren(rows.length ? table : h("p", { class: "rc__empty", text: `Nenhum registro no contexto filtrado` }));
    c.tableWrap.classList.toggle("is-all", st.showAll);
    c.tableMore.replaceChildren(st.showAll ? "Mostrar menos" : "Ver tudo", h("span", { "aria-hidden": "true", text: st.showAll ? "‹" : "›" }));
    c.tableMore.hidden = rows.length <= (c.fluid ? 12 : 7);
    countTo(c.tableCount, c.tableLast || 0, rows.length, "int", 600);
    c.tableLast = rows.length;
    if (animate) { c.tableCard.classList.remove("is-sweep"); void c.tableCard.offsetWidth; c.tableCard.classList.add("is-sweep"); }
    c.tableRowsCache = rows;
  }

  /* ----- montagem das páginas ----- */
  function buildMain(c) {
    const { R } = c;
    c.ticker = h("div", { class: "tk a-fade", style: "--i:1" });
    c.kpiBox = h("div", { class: "kps" });
    const tCard = card(R.trend.title, "últimos 12 meses · clique na barra para filtrar", 5, "rc--trend", true);
    c.trendBody = h("div", { class: "rc__body" }); tCard.append(c.trendBody);
    const sCard = card(R.share.title, "top 4 + Outros · clique para filtrar", 6, "rc--share", true);
    c.shareBody = h("div", { class: "rc__body" }); sCard.append(c.shareBody);
    const rCard = card(R.ranking.title, "clique para filtrar", 7, "rc--rank", true);
    c.rankBody = h("div", { class: "rc__body" }); rCard.append(c.rankBody);
    return h("div", { class: "pg pg--main" }, c.hd.el, c.ticker, c.kpiBox, h("div", { class: "pg__row" }, tCard, sCard, rCard));
  }

  function buildDetail(c) {
    c.filtersRow = h("div", { class: "pg__filters" });
    c.listCol = h("div", { class: "pg__list" });
    c.tableCard = card(`${c.R.unit[0].toUpperCase()}${c.R.unit.slice(1)}`, null, 6, "rc--table");
    c.tableCount = h("strong", { text: "0" });
    const search = h("input", { type: "search", class: "rf__search", placeholder: "Buscar na tabela…", value: c.st.search });
    search.addEventListener("input", () => { c.st.search = search.value; renderTable(c, true); });
    search.addEventListener("click", (e) => e.stopPropagation());
    c.tableMore = h("button", { type: "button", class: "rc__more rc__more--accent", onclick: (e) => { e.stopPropagation(); c.st.showAll = !c.st.showAll; renderTable(c, true); } });
    const exp = h("button", { type: "button", class: "rc__csv", text: "⭳ CSV", title: "Exportar o que está na tabela", onclick: (e) => { e.stopPropagation(); exportCSV(c); } });
    c.tableCard.querySelector(".rc__head").append(h("span", { class: "tb__count" }, c.tableCount, " no filtro"), search, exp);
    c.tableFoot = h("div", { class: "tb__foot" }, h("span", { class: "tb__hint", text: "Clique numa célula de dimensão para filtrar" }), c.tableMore);
    c.tableWrap = h("div", { class: "tb__wrap" });
    c.tableCard.append(h("div", { class: "tb__sweep", "aria-hidden": "true" }), c.tableWrap, c.tableFoot);
    return h("div", { class: "pg pg--detail" }, c.hd.el, c.filtersRow, h("div", { class: "pg__split" }, c.listCol, c.tableCard));
  }

  /* ----- página de análise ----- */
  function buildAnalysis(c) {
    const { R } = c;
    const mk = (title, sub, i, cls) => { const el = card(title, sub, i, cls, true); const body = h("div", { class: "rc__body" }); el.append(body); return [el, body]; };
    const [heat, hb] = mk(`${R.trend.title.split(" por ")[0]} por ${R.dims.f.label.toLowerCase()} e mês`, "intensidade = volume · clique para filtrar", 1, "rc--heat");
    const [vari, vb] = mk(`Variação por ${R.dims.cat.label.toLowerCase()}`, "último mês completo vs anterior", 2, "rc--var");
    const [abc, ab] = mk(`Curva ABC · ${R.dims.ent.label.toLowerCase()}`, "A = até 80% do valor · B = até 95% · C = restante", 3, "rc--abc");
    const [wk, wb] = mk("Por dia da semana", "distribuição no período", 4, "rc--week");
    c.heatBody = hb; c.varBody = vb; c.abcBody = ab; c.weekBody = wb;
    return h("div", { class: "pg pg--analysis" }, c.hd.el, h("div", { class: "pg__grid" }, heat, vari, abc, wk));
  }

  function renderHeat(c) {
    const { R, M, st } = c;
    const k = R.kpis[R.trend.kpi];
    const rows = filtered(M, st, { selMonth: true, f: true });
    const fs = R.dims.f.values;
    const cells = fs.map((f) => M.months.map((m) => kpiOf(R, rows.filter((x) => x.f === f && x.mk === m.key), R.trend.kpi) || 0));
    const max = Math.max(1, ...cells.flat());
    const grid = h("div", { class: "hm", style: `--cols:${M.months.length}` },
      h("span"), ...M.months.map((m) => h("span", { class: "hm__mh", text: m.label.split("/")[0] + (m.partial ? "*" : "") })), h("span", { class: "hm__mh", text: "Total" }));
    fs.forEach((f, ri) => {
      const total = cells[ri].reduce((a, b) => a + b, 0);
      grid.append(h("span", { class: "hm__rh" + (st.f.size && !st.f.has(f) ? " is-dim" : ""), text: f }));
      M.months.forEach((m, ci) => {
        const v = cells[ri][ci], r = v / max;
        const cell = h("button", {
          type: "button", class: "hm__cell a-cell" + ((st.sel.month && st.sel.month !== m.key) || (st.f.size && !st.f.has(f)) ? " is-dim" : ""),
          style: `--a:${(0.08 + r * 0.92).toFixed(3)};--i:${ri * 3 + ci};color:${r > 0.55 ? "#071E38" : "#fff"}`,
          text: v ? compact(v) : "–",
          onclick: (e) => { e.stopPropagation(); st.sel.month = st.sel.month === m.key ? null : m.key; update(); }
        });
        tipOn(cell, () => [`${f} · ${m.label}`, [[k.label, fmt(v, k.fmt, true)], ["% do total da linha", total ? nf(1).format((v / total) * 100) + "%" : "s/ dado"]]]);
        grid.append(cell);
      });
      grid.append(h("strong", { class: "hm__tot", text: fmt(total, k.fmt) }));
    });
    c.heatBody.replaceChildren(grid);
  }

  function renderVariation(c) {
    const { R, M, st } = c;
    const k = R.kpis[R.trend.kpi];
    const base = baseRows(M, st, true);
    const a = M.months[10], b = M.months[9];
    const items = R.dims.cat.values.map((name) => {
      const mine = base.filter((x) => x.cat === name);
      const va = kpiOf(R, mine.filter((x) => x.mk === a.key), R.trend.kpi) || 0;
      const vb = kpiOf(R, mine.filter((x) => x.mk === b.key), R.trend.kpi) || 0;
      return { name, va, vb, d: vb ? ((va - vb) / vb) * 100 : 0 };
    }).sort((x, y) => y.d - x.d);
    const lim = Math.max(10, ...items.map((x) => Math.abs(x.d)));
    const list = h("ul", { class: "vr" }, items.map((x, i) => {
      const up = x.d >= 0;
      const good = k.lowerIsBetter ? !up : up;
      const li = h("li", {
        class: "vr__row a-in" + (st.sel.cat.size && !st.sel.cat.has(x.name) ? " is-dim" : ""), style: `--i:${i}`,
        onclick: (e) => { e.stopPropagation(); toggle(st.sel.cat, x.name, e); update(); }
      }, h("span", { class: "vr__name", text: x.name }),
        h("span", { class: "vr__track" }, h("i", { class: "vr__bar a-growx " + (good ? "is-good" : "is-bad") + (up ? " is-up" : " is-down"), style: `--w:${(Math.abs(x.d) / lim) * 50}%;--i:${i}` })),
        h("strong", { class: good ? "is-good" : "is-bad", text: `${up ? "▲" : "▼"} ${nf(1).format(Math.abs(x.d))}%` }));
      tipOn(li, () => [x.name, [[a.label, fmt(x.va, k.fmt, true)], [b.label, fmt(x.vb, k.fmt, true)], ["Variação", `${up ? "+" : ""}${nf(1).format(x.d)}%`]]]);
      return li;
    }));
    c.varBody.replaceChildren(list, h("p", { class: "rc__note", text: `${a.label} vs ${b.label} · barra à direita = alta, à esquerda = queda` }));
  }

  function renderABC(c) {
    const { R, M, st } = c;
    const k = R.kpis[R.ranking.kpi];
    const rows = filtered(M, st, { selEnt: true });
    const all = R.dims.ent.values.map((name) => ({ name, v: kpiOf(R, rows.filter((x) => x.ent === name), R.ranking.kpi) || 0 }))
      .filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
    const tot = all.reduce((a, x) => a + x.v, 0) || 1;
    let acc = 0;
    all.forEach((x) => { acc += x.v; x.cum = (acc / tot) * 100; x.cls = x.cum - (x.v / tot) * 100 < 80 ? "A" : x.cum - (x.v / tot) * 100 < 95 ? "B" : "C"; });
    const count = (cl) => all.filter((x) => x.cls === cl).length;
    const summary = h("div", { class: "abc__sum" }, ["A", "B", "C"].map((cl) => h("span", { class: "badge badge--abc-" + cl.toLowerCase() }, `Classe ${cl} · ${count(cl)} ${count(cl) === 1 ? "item" : "itens"}`)));
    const fitN = c.fluid ? 10 : 6;
    const table = h("div", { class: "abc" }, all.slice(0, fitN).map((x, i) => {
      const row = h("div", {
        class: "abc__row a-in" + (st.sel.ent.size && !st.sel.ent.has(x.name) ? " is-dim" : ""), style: `--i:${i}`,
        onclick: (e) => { e.stopPropagation(); toggle(st.sel.ent, x.name, e); update(); }
      }, h("span", { class: "abc__pos", text: String(i + 1) }), h("span", { class: "abc__name", text: x.name }),
        h("strong", { class: "abc__v", text: fmt(x.v, k.fmt) }),
        h("span", { class: "abc__track" }, h("i", { class: "a-growx", style: `--w:${x.cum}%;--i:${i}` }), h("b", { style: "left:80%" }), h("b", { style: "left:95%" })),
        h("em", { text: nf(1).format(x.cum) + "%" }),
        h("span", { class: "badge badge--abc-" + x.cls.toLowerCase(), text: x.cls }));
      tipOn(row, () => [`${i + 1}º · ${x.name}`, [[k.label, fmt(x.v, k.fmt, true)], ["Participação", nf(1).format((x.v / tot) * 100) + "%"], ["Acumulado", nf(1).format(x.cum) + "%"], ["Classe", x.cls]]]);
      return row;
    }));
    const more = all.length > fitN ? h("button", { type: "button", class: "rc__more", title: "Ver a lista completa na página Detalhe", onclick: (e) => { e.stopPropagation(); go("detail"); } }, `+ ${all.length - fitN} outros`, h("span", { "aria-hidden": "true", text: "›" })) : null;
    c.abcBody.replaceChildren(summary, table, more);
  }

  function renderWeek(c) {
    const { R, st } = c;
    const k = R.kpis[R.trend.kpi];
    const names = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const order = [1, 2, 3, 4, 5, 6, 0];
    const vals = order.map((d) => kpiOf(R, c.rows.filter((x) => x.date.getDay() === d), R.trend.kpi) || 0);
    const max = Math.max(1, ...vals);
    const tot = vals.reduce((a, b) => a + b, 0) || 1;
    const maxI = vals.indexOf(max);
    const box = h("div", { class: "wk" }, order.map((d, i) => {
      const col = h("div", { class: "wk__col" + (i === maxI ? " is-max" : "") },
        h("span", { class: "wk__val", text: nf(0).format((vals[i] / tot) * 100) + "%" }),
        h("span", { class: "wk__bar a-growy", style: `--h:${(vals[i] / max) * 100}%;--i:${i}` }),
        h("span", { class: "wk__lbl", text: names[d] }));
      tipOn(col, () => [names[d], [[k.label, fmt(vals[i], k.fmt, true)], ["Participação", nf(1).format((vals[i] / tot) * 100) + "%"]]]);
      return col;
    }));
    c.weekBody.replaceChildren(box);
  }

  const buildPage = (c, page) => (page === "main" ? buildMain(c) : page === "analysis" ? buildAnalysis(c) : buildDetail(c));

  /* ----- ciclo de atualização ----- */
  function update(opts = {}) {
    const c = ctx;
    if (!c) return;
    hideTip();
    c.rows = filtered(c.M, c.st);
    const opening = !!opts.opening;
    renderHeader(c);
    if (c.st.page === "main") {
      renderTicker(c);
      renderKpis(c, true);
      renderTrend(c);
      renderShare(c, true);
      renderRanking(c);
    } else if (c.st.page === "analysis") {
      renderHeat(c);
      renderVariation(c);
      renderABC(c);
      renderWeek(c);
    } else {
      c.filtersRow.replaceChildren(dateFilter(c, 1), chipFilter(c, "f", 2), chipFilter(c, "cat", 3), chipFilter(c, "st", 4));
      c.listCol.replaceChildren(listFilter(c, 5));
      renderTable(c, true);
    }
    if (!opening) c.page.classList.add("no-fade");
    const active = c.st.f.size + c.st.cat.size + c.st.ent.size + c.st.st.size + c.st.sel.cat.size + c.st.sel.ent.size + (c.st.sel.month ? 1 : 0) + (c.st.range !== "all" ? 1 : 0);
    c.resetBtn.disabled = !active;
    c.resetBtn.textContent = active ? `Redefinir filtros (${active})` : "Redefinir filtros";
  }

  function go(page) {
    const c = ctx;
    c.st.page = page;
    c.tabs.forEach((t) => t.classList.toggle("is-on", t.dataset.page === page));
    c.hd = header(c.d, c.R, c.M, c.st);
    c.page = buildPage(c, page);
    c.canvas.replaceChildren(c.page);
    fit();
    // primeiro o BI "se desenha" (bordas e esqueleto), depois entram os dados
    if (page === "main") c.kpiBox.replaceChildren(...[0, 1, 2, 3].map((i) => h("div", { class: "kp kp--ghost a-fade", style: `--i:${i + 1}` })));
    c.page.classList.add("is-drawing");
    clearTimeout(c.drawT);
    const pg = c.page;
    c.drawT = setTimeout(() => { if (ctx !== c || c.page !== pg) return; pg.classList.remove("is-drawing"); update({ opening: true }); }, 720);
  }

  /* ----- escala (FitToPage) ----- */
  function fit() {
    const c = ctx;
    if (!c) return;
    const stage = c.stage;
    const fluid = stage.clientWidth < 820;
    c.fluid = fluid;
    c.canvas.classList.toggle("is-fluid", fluid);
    if (fluid) { c.canvas.style.transform = ""; c.canvas.style.zoom = ""; c.canvas.style.width = ""; c.canvas.style.height = ""; c.sizer.style.cssText = ""; return; }
    const k = Math.min((stage.clientWidth - 24) / W, (stage.clientHeight - 24) / H);
    c.canvas.style.width = W + "px"; c.canvas.style.height = H + "px";
    // zoom mantém o texto nítido; transform fica como alternativa
    if (ZOOM) { c.canvas.style.zoom = k; c.canvas.style.transform = ""; } else c.canvas.style.transform = `scale(${k})`;
    c.sizer.style.cssText = `width:${W * k}px;height:${H * k}px`;
  }

  /* ----- exportações ----- */
  function exportCSV(c) {
    const cols = colsOf(c.R);
    const rows = c.st.page === "detail" && c.tableRowsCache ? c.tableRowsCache : filtered(c.M, c.st);
    const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [cols.map((x) => q(x.label)).join(";")];
    rows.forEach((x) => lines.push(cols.map((col) => q(col.num ? nf(2).format(col.get(x)) : col.show(x))).join(";")));
    download(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${c.d.id}-demonstracao.csv`);
  }
  const download = (blob, name) => {
    const a = h("a", { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const loadScript = (src) => new Promise((ok, fail) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const sc = h("script", { src }); sc.onload = ok; sc.onerror = fail; document.head.append(sc);
  });
  async function exportPDF(c, btn) {
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Gerando PDF…";
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [W, H], hotfixes: ["px_scaling"] });
      const back = c.st.page;
      const wasFluid = c.fluid;
      c.capturing = true;
      for (const [i, pg] of ["main", "analysis", "detail"].entries()) {
        c.st.page = pg;
        c.tabs.forEach((t) => t.classList.toggle("is-on", t.dataset.page === pg));
        c.hd = header(c.d, c.R, c.M, c.st);
        c.page = buildPage(c, pg);
        c.canvas.replaceChildren(c.page);
        c.canvas.classList.add("is-capture");
        c.canvas.classList.remove("is-fluid");
        c.fluid = false;
        update();
        c.page.classList.add("no-anim");
        await new Promise((r) => setTimeout(r, 1100));
        const prev = c.canvas.style.transform, prevZ = c.canvas.style.zoom;
        c.canvas.style.transform = "none"; c.canvas.style.zoom = "1";
        const shot = await window.html2canvas(c.canvas, { backgroundColor: "#071E38", scale: 2, width: W, height: H, windowWidth: W, windowHeight: H });
        c.canvas.style.transform = prev; c.canvas.style.zoom = prevZ;
        if (i) pdf.addPage([W, H], "landscape");
        pdf.addImage(shot.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W, H);
      }
      c.canvas.classList.remove("is-capture");
      c.capturing = false;
      pdf.save(`${c.d.id}-demonstracao.pdf`);
      c.fluid = wasFluid;
      go(back);
      btn.textContent = label;
    } catch (err) {
      c.capturing = false;
      c.canvas.classList.remove("is-capture");
      btn.textContent = "Não foi possível gerar o PDF";
      setTimeout(() => { btn.textContent = label; }, 2500);
    }
    btn.disabled = false;
  }

  /* ----- modal ----- */
  function shell() {
    modal = h("div", { class: "rpt", role: "dialog", "aria-modal": "true", "aria-label": "BI de demonstração" });
    document.body.append(modal);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !modal.classList.contains("is-open")) return;
      const ex = modal.querySelector(".rc.is-expanded");
      if (ex) { toggleExpand(ex, ex.querySelector(".rc__expand")); return; }
      close();
    });
    window.addEventListener("resize", () => { if (ctx && !ctx.capturing) { const was = ctx.fluid; fit(); if (was !== ctx.fluid) go(ctx.st.page); } });
  }

  function open(d) {
    if (!d.report) return;
    if (!modal) shell();
    const R = d.report, M = buildModel(d);
    const st = freshState(M);
    const c = ctx = { d, R, M, st, lastFocus: document.activeElement };

    const closeBtn = h("button", { type: "button", class: "rpt__close", "aria-label": "Fechar", text: "✕", onclick: close });
    c.resetBtn = h("button", { type: "button", class: "rpt__btn", text: "Redefinir filtros", onclick: () => { const p = st.page; Object.assign(st, freshState(M), { page: p }); go(p); } });
    const pdfBtn = h("button", { type: "button", class: "rpt__btn", text: "Exportar PDF" });
    pdfBtn.addEventListener("click", () => exportPDF(c, pdfBtn));
    const csvBtn = h("button", { type: "button", class: "rpt__btn", text: "Exportar CSV", onclick: () => exportCSV(c) });
    c.tabs = [["main", "Visão geral"], ["analysis", "Análise"], ["detail", "Detalhe"]].map(([id, label]) => h("button", {
      type: "button", class: "rpt__tab", "data-page": id, text: label, onclick: () => go(id)
    }));
    c.canvas = h("div", { class: "rpt__canvas" });
    c.canvas.addEventListener("click", () => {
      // clique no fundo limpa o cross-filter
      if (st.sel.month || st.sel.cat.size || st.sel.ent.size) { st.sel = { month: null, cat: new Set(), ent: new Set() }; update(); }
    });
    c.sizer = h("div", { class: "rpt__sizer" }, c.canvas);
    c.stage = h("div", { class: "rpt__stage" }, c.sizer);

    modal.replaceChildren(
      h("div", { class: "rpt__backdrop", onclick: close }),
      h("div", { class: "rpt__frame" },
        h("div", { class: "rpt__bar" },
          h("div", { class: "rpt__name" }, h("span", { class: "rpt__app", text: "Power BI" }), h("strong", { text: d.title })),
          h("span", { class: "rpt__demo", text: "Demonstração · dados fictícios" }),
          h("div", { class: "rpt__actions" }, c.resetBtn, pdfBtn, csvBtn, closeBtn)),
        c.stage,
        h("div", { class: "rpt__tabs" }, c.tabs, h("span", { class: "rpt__hint", text: "Ctrl + clique seleciona mais de um item" }))));

    modal.classList.add("is-open");
    document.documentElement.classList.add("rpt-lock");
    requestAnimationFrame(() => { go("main"); closeBtn.focus({ preventScroll: true }); });
  }

  function close() {
    hideTip();
    modal.classList.remove("is-open");
    document.documentElement.classList.remove("rpt-lock");
    if (ctx && ctx.lastFocus) ctx.lastFocus.focus({ preventScroll: true });
    ctx = null;
  }

  window.Report = { open };
})();
