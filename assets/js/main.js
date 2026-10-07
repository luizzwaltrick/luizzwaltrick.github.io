(function () {
  "use strict";

  const data = window.PORTFOLIO;
  const p = data.profile;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // As animações ficam sempre ligadas: máquinas corporativas costumam desligar as do sistema operacional.
  const reduceMotion = false;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const tags = (list) => `<ul class="tags">${list.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;

  const ICONS = {
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    check: '<path d="M9 12l2 2 4-4"/><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/>',
    linkedin: '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z"/>',
    whatsapp: '<path d="M3 21l1.65-3.8A9 9 0 1112 21a9 9 0 01-4.4-1.15z"/><path d="M8.6 8.4c0 3.3 3.7 7 7 7l1.3-1.6-2.1-1-1 .9c-1.1-.3-2.3-1.5-2.6-2.6l.9-1-1-2.1z"/>',
    github: '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 00-.9-2.6c3.1-.4 6.4-1.5 6.4-7A5.4 5.4 0 0020 4.8 5 5 0 0019.9 1S18.7.6 16 2.5a13.4 13.4 0 00-7 0C6.3.6 5.1 1 5.1 1A5 5 0 005 4.8a5.4 5.4 0 00-1.5 3.7c0 5.4 3.3 6.6 6.4 7a3.4 3.4 0 00-.9 2.6V22"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    code2: '<path d="M4 17l6-6-6-6M12 19h8"/>',
    file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3"/>',
    arrow: '<path d="M7 17L17 7M8 7h9v9"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    play: '<path d="M7 4v16l13-8z"/>'
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const whatsappUrl = p.whatsapp
    ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(p.whatsappMessage || "")}`
    : "";

  /* ---------- Recarregar sempre volta ao início ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const initialHash = location.hash;
  if (initialHash) history.replaceState(null, "", location.pathname + location.search);
  window.scrollTo(0, 0);
  const toTop = () => window.scrollTo(0, 0);
  window.addEventListener("pageshow", toTop);
  window.addEventListener("load", () => { toTop(); setTimeout(toTop, 0); setTimeout(toTop, 120); });
  // Se a página abriu com #âncora, o navegador ainda pode pular para ela logo depois do load.
  if (initialHash) {
    const until = performance.now() + 800;
    const guard = () => { if (window.scrollY !== 0) toTop(); if (performance.now() < until) requestAnimationFrame(guard); };
    requestAnimationFrame(guard);
  }

  /* ---------- Rolagem animada para as âncoras ---------- */
  // Feita em JS para funcionar mesmo quando o sistema desliga a rolagem suave do navegador.
  let scrollAnim = 0;
  const smoothTo = (y) => {
    cancelAnimationFrame(scrollAnim);
    const start = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const end = Math.max(0, Math.min(max, y));
    const dist = end - start;
    if (Math.abs(dist) < 2) return;
    const dur = Math.min(1400, Math.max(550, Math.abs(dist) * 0.45));
    const t0 = performance.now();
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, start + dist * ease(k));
      if (k < 1) scrollAnim = requestAnimationFrame(step);
    };
    scrollAnim = requestAnimationFrame(step);
  };
  const stopScrollAnim = () => cancelAnimationFrame(scrollAnim);
  window.addEventListener("wheel", stopScrollAnim, { passive: true });
  window.addEventListener("touchstart", stopScrollAnim, { passive: true });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#") return;
    e.preventDefault();
    if (id === "#top") { smoothTo(0); return; }
    const target = document.querySelector(id);
    if (!target) return;
    const navH = document.querySelector(".nav").offsetHeight;
    smoothTo(target.getBoundingClientRect().top + window.scrollY - navH + 1);
  });

  /* ---------- Perfil ---------- */
  $$("[data-bind]").forEach((el) => { el.textContent = p[el.dataset.bind] || ""; });
  $("#about-text").innerHTML = p.about.map((t) => `<p>${esc(t)}</p>`).join("");
  $("#facts").innerHTML = (p.facts || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  /* ---------- Hero: texto rotativo (efeito digitação) ---------- */
  const typed = $("#typed");
  if (typed && p.rotating && p.rotating.length) {
    if (reduceMotion) {
      typed.textContent = p.rotating[0];
    } else {
      let w = 0, c = 0, deleting = false;
      const tick = () => {
        const word = p.rotating[w];
        c += deleting ? -1 : 1;
        typed.textContent = word.slice(0, c);
        let delay = deleting ? 38 : 75;
        if (!deleting && c === word.length) { deleting = true; delay = 1800; }
        else if (deleting && c === 0) { deleting = false; w = (w + 1) % p.rotating.length; delay = 300; }
        setTimeout(tick, delay);
      };
      setTimeout(tick, 900);
    }
  }

  /* ---------- Hero: contadores ---------- */
  $("#hero-stats").innerHTML = p.stats.map((s) =>
    `<li><strong data-to="${s.to}" data-prefix="${esc(s.prefix || "")}" data-suffix="${esc(s.suffix || "")}">${esc((s.prefix || "") + "0" + (s.suffix || ""))}</strong><span>${esc(s.label)}</span></li>`
  ).join("");

  const runCounter = (node, ms = 1600) => {
    const to = Number(node.dataset.to);
    const pre = node.dataset.prefix || "", suf = node.dataset.suffix || "";
    if (reduceMotion) { node.textContent = pre + to + suf; return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      node.textContent = pre + Math.round(to * (1 - Math.pow(1 - k, 4))) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Hero: código "sendo digitado" linha a linha ---------- */
  const code = $("#hero-code");
  if (code) {
    code.innerHTML = code.innerHTML.split("\n")
      .map((line, i) => `<span class="code-line" style="--i:${i}">${line || " "}</span>`).join("");
  }

  /* ---------- Hero: mini gráfico ---------- */
  const heroBars = [38, 52, 45, 60, 58, 72, 66, 80, 76, 88];
  $("#hero-chart").innerHTML = heroBars
    .map((v, i) => `<span style="--h:${v}%;--d:${1400 + i * 70}ms"></span>`).join("");

  /* ---------- Hero: rede de partículas (dados fluindo) ---------- */
  const canvas = $("#hero-canvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let W, H, pts, running = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const mouse = { x: -999, y: -999 };
    const resize = () => {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        c: ["56,189,248", "167,139,250", "52,211,153"][Math.floor(Math.random() * 3)]
      }));
    };
    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const a of pts) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 140) { a.x += (a.x - mouse.x) / dm * 0.6; a.y += (a.y - mouse.y) / dm * 0.6; }
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(${a.c},${(1 - d / 120) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${a.c},0.7)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(([en]) => {
      const was = running;
      running = en.isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(canvas);
    requestAnimationFrame(frame);
  }

  /* ---------- Serviços ---------- */
  $("#services").innerHTML = data.services.map((s) => `
    <article class="card service spot draw reveal">
      <div class="service__icon">${icon(s.icon)}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      ${tags(s.tags)}
    </article>`).join("");

  /* ---------- Marquee de tecnologias ---------- */
  const groups = Object.values(data.stack);
  const DOTS = ["#38bdf8", "#a78bfa", "#34d399", "#fbbf24"];
  const chip = (t, gi) => `<span class="marquee__item" style="--c:${DOTS[gi % DOTS.length]}"><i></i>${esc(t)}</span>`;
  const rowA = groups.flatMap((g, gi) => g.slice(0, Math.ceil(g.length / 2)).map((t) => chip(t, gi))).join("");
  const rowB = groups.flatMap((g, gi) => g.slice(Math.ceil(g.length / 2)).map((t) => chip(t, gi))).join("");
  $("#marquee").innerHTML =
    `<div class="marquee__row marquee__row--a">${rowA.repeat(4)}</div><div class="marquee__row marquee__row--b">${rowB.repeat(4)}</div>`;
  {
    // Movimento contínuo; acelera enquanto a página rola e desacelera quando o mouse está em cima.
    const rows = [[$(".marquee__row--a"), -1, 0], [$(".marquee__row--b"), 1, 0]];
    let lastY = window.scrollY, boost = 0, hover = false;
    $("#marquee").addEventListener("pointerenter", () => { hover = true; });
    $("#marquee").addEventListener("pointerleave", () => { hover = false; });
    let lastT = performance.now();
    const loop = (t) => {
      const dt = Math.min(50, t - lastT); lastT = t;
      const y = window.scrollY;
      boost = boost * 0.92 + Math.min(40, Math.abs(y - lastY)) * 0.08;
      lastY = y;
      const speed = (hover ? 0.012 : 0.045) * (1 + boost * 0.9);
      rows.forEach((r) => {
        const half = r[0].scrollWidth / 2;
        r[2] = (r[2] + r[1] * speed * dt) % half;
        const x = r[1] < 0 ? r[2] : r[2] - half;
        r[0].style.transform = `translate3d(${x}px,0,0)`;
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* ---------- Dashboards ---------- */
  const fmtPreview = (v, pre, suf) =>
    pre + new Intl.NumberFormat("pt-BR", { maximumFractionDigits: v % 1 ? 1 : 0, minimumFractionDigits: v % 1 ? 1 : 0 }).format(v) + suf;

  const previewHTML = (d) => {
    if (d.image) {
      return `<img src="${esc(d.image)}" alt="Print do dashboard ${esc(d.title)}" loading="lazy">`;
    }
    const pv = d.preview;
    const max = Math.max(...pv.bars);
    const pts = pv.bars.map((v, i) => `${(i / (pv.bars.length - 1)) * 100},${100 - (v / max) * 85}`).join(" ");
    return `
      <div class="preview">
        <div class="preview__top">
          <span class="preview__title"><span class="preview__logo"><i></i><i></i><i></i></span>${esc(d.title)}</span>
          <span class="preview__pills"><i></i><i></i><i></i></span>
        </div>
        <div class="preview__kpis">
          ${pv.kpis.map(([k, v, pre, suf], ki) => `<div style="--k:${["#54B5FB", "#00DDFF", "#0B72D7"][ki]}"><small>${esc(k)}</small><strong data-v="${v}" data-pre="${esc(pre)}" data-suf="${esc(suf)}">${esc(fmtPreview(v, pre, suf))}</strong></div>`).join("")}
        </div>
        <div class="preview__body">
          <div class="preview__bars">
            ${pv.bars.map((v, i) => `<span class="${i === pv.bars.length - 1 ? "is-partial" : v === max ? "is-max" : ""}" style="--h:${(v / max) * 100}%;--d:${i * 45}ms"></span>`).join("")}
          </div>
          <div class="preview__side">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="preview__line" aria-hidden="true">
              <polyline points="${pts}" pathLength="1" />
            </svg>
            <div class="preview__donut"></div>
          </div>
        </div>
        <div class="preview__scan" aria-hidden="true"></div>
      </div>`;
  };

  const categories = ["Todos", ...new Set(data.dashboards.map((d) => d.category))];
  $("#bi-filters").innerHTML = categories.map((c, i) =>
    `<button type="button" class="chip${i === 0 ? " is-active" : ""}" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");

  $("#dashboards").innerHTML = data.dashboards.map((d, idx) => `
    <article class="dash draw reveal" data-cat="${esc(d.category)}">
      <div class="dash__media" role="button" tabindex="0" data-open="${idx}" aria-label="Abrir o BI ${esc(d.title)} em modo interativo">
        <div class="dash__tilt">
          ${previewHTML(d)}
          <div class="dash__show" aria-hidden="true">
            <div class="dash__show-head">
              <span class="dash__live mono">${icon("play")} apresentação</span>
              <strong>${esc(d.title)}</strong>
            </div>
            <ol class="dash__steps">
              ${d.highlights.map((h, i) => `<li style="--s:${i}">${esc(h)}</li>`).join("")}
            </ol>
            <span class="dash__cta">${icon("expand")} Clique para abrir o BI completo</span>
          </div>
        </div>
      </div>
      <div class="dash__info">
        <p class="eyebrow mono">${esc(d.category)}</p>
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.description)}</p>
        <ul class="checks">${d.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
        ${tags(d.tools)}
        <div class="dash__actions">
          <button type="button" class="btn btn--small" data-open="${idx}">${icon("expand")} Abrir BI interativo</button>
          ${d.link ? `<a class="link" href="${esc(d.link)}" target="_blank" rel="noopener">Ver versão publicada ${icon("arrow")}</a>` : ""}
        </div>
      </div>
    </article>`).join("");

  // Contagem dos KPIs da prévia
  const countPreview = (root) => {
    $$(".preview__kpis strong", root).forEach((n) => {
      const to = Number(n.dataset.v), pre = n.dataset.pre, suf = n.dataset.suf;
      if (reduceMotion) return;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 900);
        const v = to * (1 - Math.pow(1 - k, 3));
        n.textContent = fmtPreview(to % 1 ? Math.round(v * 10) / 10 : Math.round(v), pre, suf);
        if (k < 1) requestAnimationFrame(step);
        else n.textContent = fmtPreview(to, pre, suf);
      };
      requestAnimationFrame(step);
    });
  };

  // Hover = apresentação animada; clique = BI completo
  $$(".dash__media").forEach((media) => {
    const play = () => {
      if (media.classList.contains("is-playing")) return;
      media.classList.remove("is-playing");
      void media.offsetWidth; // reinicia as animações CSS
      media.classList.add("is-playing");
      countPreview(media);
    };
    const stop = () => {
      media.classList.remove("is-playing");
      const tilt = $(".dash__tilt", media);
      tilt.style.transform = "";
    };
    media.addEventListener("pointerenter", play);
    media.addEventListener("focus", play);
    media.addEventListener("pointerleave", stop);
    media.addEventListener("blur", stop);
    if (finePointer && !reduceMotion) {
      const tilt = $(".dash__tilt", media);
      media.addEventListener("pointermove", (e) => {
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.02)`;
        media.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
        media.style.setProperty("--my", `${(y + 0.5) * 100}%`);
      });
    }
    media.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); media.click(); }
    });
  });

  // Em telas de toque não há hover: a apresentação roda quando o card entra na tela
  if (!finePointer && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-playing");
        countPreview(en.target);
        io.unobserve(en.target);
      }
    }), { threshold: 0.6 });
    $$(".dash__media").forEach((m) => io.observe(m));
  }

  $("#dashboards").addEventListener("click", (e) => {
    const t = e.target.closest("[data-open]");
    if (t) window.Report.open(data.dashboards[Number(t.dataset.open)]);
  });

  $("#bi-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    $$("#bi-filters .chip").forEach((c) => {
      const active = c === btn;
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", active);
    });
    const cat = btn.dataset.cat;
    $$("#dashboards .dash").forEach((el) => {
      const show = cat === "Todos" || el.dataset.cat === cat;
      el.hidden = !show;
      if (show) { el.classList.remove("is-visible"); void el.offsetWidth; el.classList.add("is-visible"); }
    });
  });

  /* ---------- Como trabalho ---------- */
  $("#steps").innerHTML = (data.process || []).map((st, i) => `
    <li class="step reveal" style="--s:${i}">
      <span class="step__n">${String(i + 1).padStart(2, "0")}</span>
      <h3>${esc(st.title)}</h3>
      <p>${esc(st.text)}</p>
      <span class="step__out">${esc(st.deliverable)}</span>
    </li>`).join("");
  $("#models").innerHTML = (data.engagements || []).map((m) => `
    <article class="model draw reveal${m.featured ? " is-featured" : ""}">
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.ideal)}</p>
      <ul>${m.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    </article>`).join("");

  /* ---------- Cases ---------- */
  const caseVisual = (c) => {
    switch (c.visual) {
      case "deploy": {
        const cells = Array.from({ length: 72 }, (_, i) => `<i style="--i:${i}"></i>`).join("");
        return `
          <div class="cv cv--deploy">
            <div class="cv__row"><span>Antes</span><div class="cv__bar"><i style="--w:100%"></i></div><strong>30 min</strong></div>
            <div class="cv__row"><span>Depois</span><div class="cv__bar cv__bar--after"><i style="--w:2%"></i></div><strong>20 s</strong></div>
            <p class="cv__cap">Mais de 70 repositórios com deploy automático</p>
            <div class="cv__cells">${cells}</div>
          </div>`;
      }
      case "git": {
        const commits = [[40, 70], [100, 70], [160, 70], [250, 70], [330, 70], [410, 70], [470, 70]];
        const dots = commits.map(([x, y], i) => `<circle class="cv__dot" cx="${x}" cy="${y}" r="7" style="--i:${i}"/>`).join("");
        return `
          <div class="cv cv--git">
            <svg viewBox="0 0 510 150" aria-hidden="true">
              <path class="cv__line cv__line--main" d="M20 70 H490" pathLength="1"/>
              <path class="cv__line cv__line--a" d="M100 70 C130 70 130 25 160 25 H220 C250 25 250 70 280 70" pathLength="1"/>
              <path class="cv__line cv__line--b" d="M250 70 C280 70 280 118 310 118 H380 C410 118 410 70 440 70" pathLength="1"/>
              <circle class="cv__dot cv__dot--a" cx="190" cy="25" r="6" style="--i:3"/>
              <circle class="cv__dot cv__dot--b" cx="345" cy="118" r="6" style="--i:5"/>
              ${dots}
              <text x="190" y="12" text-anchor="middle">tema</text>
              <text x="345" y="143" text-anchor="middle">visuais</text>
              <text x="470" y="98" text-anchor="middle">main</text>
            </svg>
            <div class="cv__files">
              <span>Financeiro.pbip</span><span>Comercial.pbip</span><span>RH.pbip</span><span>Logística.pbip</span>
            </div>
          </div>`;
      }
      case "hours": {
        const cells = Array.from({ length: 50 }, (_, i) => `<i style="--i:${i}"></i>`).join("");
        return `
          <div class="cv cv--hours">
            <div class="cv__legend"><span><b class="is-manual"></b>manual</span><span><b class="is-auto"></b>automatizado</span><em>cada bloco = 10 h por mês</em></div>
            <div class="cv__grid">${cells}</div>
          </div>`;
      }
      case "monitor": {
        const pts = [22, 24, 23, 27, 30, 36, 44, 55, 63, 72, 78, 80, 76, 30, 24, 22, 23, 21, 22, 23];
        const W = 500, H = 140;
        const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - (v / 90) * H]);
        const d = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
        const fixX = xy[13][0];
        return `
          <div class="cv cv--monitor">
            <div class="cv__mhead"><span class="cv__live"></span>Netdata · tempo de resposta do servidor</div>
            <svg viewBox="0 0 ${W} ${H + 4}" aria-hidden="true">
              <rect class="cv__warn" x="${xy[5][0]}" y="0" width="${fixX - xy[5][0]}" height="${H}"/>
              <path class="cv__area" d="${d} L${W} ${H} L0 ${H} Z"/>
              <path class="cv__line cv__line--mon" d="${d}" pathLength="1"/>
              <line class="cv__fix" x1="${fixX}" x2="${fixX}" y1="0" y2="${H}"/>
            </svg>
            <div class="cv__notes"><span class="is-bad">lentidão: cache acumulado</span><span class="is-good">cache corrigido</span></div>
          </div>`;
      }
      default: return "";
    }
  };
  $("#case-list").innerHTML = (data.cases || []).map((c, i) => `
    <article class="case draw reveal">
      <div class="case__visual">
        <div class="case__metric">
          <strong data-to="${c.metric.to}" data-prefix="${esc(c.metric.prefix || "")}" data-suffix="${esc(c.metric.suffix || "")}">${esc((c.metric.prefix || "") + "0" + (c.metric.suffix || ""))}</strong>
          <span>${esc(c.metric.label)}</span>
        </div>
        ${caseVisual(c)}
      </div>
      <div class="case__body">
        <p class="case__meta"><span>${String(i + 1).padStart(2, "0")}</span>${esc(c.company)} · ${esc(c.area)}</p>
        <h3>${esc(c.title)}</h3>
        <dl class="case__steps">
          <div><dt>Cenário</dt><dd>${esc(c.context)}</dd></div>
          <div><dt>O que fiz</dt><dd>${esc(c.action)}</dd></div>
          <div class="is-result"><dt>Resultado</dt><dd>${esc(c.result)}</dd></div>
        </dl>
        ${tags(c.tags)}
      </div>
    </article>`).join("");

  /* ---------- Projetos ---------- */
  $("#projects").innerHTML = data.projects.map((pr) => `
    <article class="card project spot draw reveal">
      <h3>${esc(pr.title)}</h3>
      <p>${esc(pr.text)}</p>
      ${tags(pr.tags)}
      ${pr.link ? `<a class="link" href="${esc(pr.link)}" target="_blank" rel="noopener">Ver projeto ${icon("arrow")}</a>` : ""}
    </article>`).join("");

  /* ---------- Experiência ---------- */
  $("#experience").innerHTML = data.experience.map((c) => `
    <li class="timeline__item reveal">
      <h3 class="timeline__company">${esc(c.company)}</h3>
      <span class="timeline__meta">${esc(c.meta)}</span>
      <div class="timeline__roles">
        ${c.roles.map((r) => `
          <div class="role spot draw reveal">
            <div class="role__head">
              <h4>${esc(r.role)}</h4>
              ${r.period ? `<span class="mono">${esc(r.period)}</span>` : ""}
            </div>
            <p>${esc(r.text)}</p>
            ${r.bullets.length ? `<ul class="role__bullets">${r.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
            ${r.tags.length ? tags(r.tags) : ""}
          </div>`).join("")}
      </div>
    </li>`).join("");

  /* ---------- Stack ---------- */
  $("#stack-list").innerHTML = Object.entries(data.stack).map(([group, items]) => `
    <div class="card stack spot draw reveal">
      <h3 class="mono">${esc(group)}</h3>
      ${tags(items)}
    </div>`).join("");

  /* ---------- Contato ---------- */
  const contacts = [
    whatsappUrl && { href: whatsappUrl, label: "WhatsApp", icon: "whatsapp", cls: "btn--wa" },
    p.linkedin && { href: p.linkedin, label: "LinkedIn", icon: "linkedin", cls: "btn--in" },
    p.email && { href: `mailto:${p.email}`, label: p.email, icon: "mail", cls: "btn--ghost" },
    p.github && { href: p.github, label: "GitHub", icon: "github", cls: "btn--ghost" },
    p.codewars && { href: p.codewars, label: "Codewars", icon: "code2", cls: "btn--ghost" },
    p.cv && { href: p.cv, label: "Baixar CV", icon: "file", cls: "btn--ghost" }
  ].filter(Boolean);
  $("#contact-links").innerHTML = contacts.map((c) => `
    <a class="btn ${c.cls}" href="${esc(c.href)}" ${c.href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>
      ${icon(c.icon)} ${esc(c.label)}
    </a>`).join("");

  // CTA do hero e botões flutuantes
  const heroCta = $("#hero-contact");
  if (whatsappUrl) {
    heroCta.href = whatsappUrl;
    heroCta.target = "_blank";
    heroCta.rel = "noopener";
    heroCta.innerHTML = `${icon("whatsapp")} Falar no WhatsApp`;
  }
  $("#hero-linkedin").href = p.linkedin;
  $("#fab").innerHTML = [
    p.linkedin && `<a class="fab fab--in" href="${esc(p.linkedin)}" target="_blank" rel="noopener" aria-label="LinkedIn">${icon("linkedin")}<span>LinkedIn</span></a>`,
    whatsappUrl && `<a class="fab fab--wa" href="${esc(whatsappUrl)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon("whatsapp")}<span>WhatsApp</span></a>`
  ].filter(Boolean).join("");

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Menu mobile ---------- */
  const toggle = $(".nav__toggle");
  const links = $("#nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Scroll: nav, barra de progresso, timeline, link ativo ---------- */
  const nav = $(".nav");
  const bar = $("#progress");
  const timeline = $("#experience");
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__links a[href^='#']");
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle("is-scrolled", y > 10);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    $("#fab").classList.toggle("is-on", y > window.innerHeight * 0.6);

    const tr = timeline.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, (window.innerHeight * 0.7 - tr.top) / tr.height));
    timeline.style.setProperty("--progress", prog);

    let current = "";
    sections.forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) current = s.id; });
    navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + current));
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Spotlight que segue o mouse nos cards ---------- */
  if (finePointer) {
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".spot");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  }

  /* ---------- Botões magnéticos ---------- */
  if (finePointer && !reduceMotion) {
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => { b.style.transform = ""; });
    });
  }

  /* ---------- Fundos animados ---------- */
  const SNIPPETS = {
    python: [
      ["k:from", " airflow.decorators ", "k:import", " dag, task"],
      ["k:import", " pandas ", "k:as", " pd"],
      [""],
      ["n:@dag", "(schedule=", "s:\"0 6 * * *\"", ", catchup=", "k:False", ")"],
      ["k:def", " ", "f:etl_operacao", "():"],
      ["    ", "n:@task"],
      ["    ", "k:def", " ", "f:extrair", "():"],
      ["        ", "k:return", " pd.read_sql(", "s:\"SELECT * FROM embarques\"", ", pg)"],
      ["    ", "n:@task"],
      ["    ", "k:def", " ", "f:validar", "(df):"],
      ["        ", "k:assert", " df[", "s:\"id\"", "].is_unique"],
      ["        ", "k:return", " df.dropna(subset=[", "s:\"data\"", "])"],
      ["    ", "n:@task"],
      ["    ", "k:def", " ", "f:carregar", "(df):"],
      ["        ", "f:publicar_dataset", "(df, ", "s:\"Torre de Controle\"", ")"],
      ["    ", "f:carregar", "(", "f:validar", "(", "f:extrair", "()))"],
      ["c:# ✔ 128.402 linhas validadas"]
    ],
    sql: [
      ["k:WITH", " receita ", "k:AS", " ("],
      ["  ", "k:SELECT", " empresa, mes, ", "f:SUM", "(valor) ", "k:AS", " total"],
      ["  ", "k:FROM", " fato_lancamentos"],
      ["  ", "k:WHERE", " natureza = ", "s:'Receita'"],
      ["  ", "k:GROUP BY", " empresa, mes"],
      ["), despesa ", "k:AS", " ("],
      ["  ", "k:SELECT", " empresa, mes, ", "f:SUM", "(valor) ", "k:AS", " total"],
      ["  ", "k:FROM", " fato_lancamentos"],
      ["  ", "k:WHERE", " natureza = ", "s:'Despesa'"],
      ["  ", "k:GROUP BY", " empresa, mes"],
      [")"],
      ["k:SELECT", " r.empresa, r.mes,"],
      ["       r.total - d.total ", "k:AS", " resultado"],
      ["k:FROM", " receita r ", "k:JOIN", " despesa d ", "k:USING", " (empresa, mes)"],
      ["k:ORDER BY", " r.mes ", "k:DESC", ";"],
      ["c:-- DRE unificado: 4 empresas, 1 consulta"]
    ],
    dax: [
      ["f:Embarques MoM %", " ="],
      ["k:VAR", " _atual = [Qtd Embarques]"],
      ["k:VAR", " _anterior ="],
      ["    ", "f:CALCULATE", "("],
      ["        [Qtd Embarques],"],
      ["        ", "f:DATEADD", "(dCalendario[Data], ", "n:-1", ", ", "k:MONTH", ")"],
      ["    )"],
      ["k:RETURN"],
      ["    ", "f:DIVIDE", "(_atual - _anterior, _anterior)"],
      [""],
      ["f:Cor OTIF", " ="],
      ["f:SWITCH", "(", "k:TRUE", "(),"],
      ["    [OTIF] >= ", "n:0.95", ", ", "s:\"#00FF18\"", ","],
      ["    [OTIF] >= ", "n:0.90", ", ", "s:\"#C8D400\"", ","],
      ["    ", "s:\"#FF5C7A\""],
      [")"]
    ]
  };
  const startCodeFx = (el) => {
    const lines = SNIPPETS[el.dataset.lang] || SNIPPETS.python;
    const box = document.createElement("div");
    box.className = "fx__lines";
    el.append(box);
    let li = 0, running = false, timer = 0;
    const MAX = 13;
    const typeLine = () => {
      if (!running) return;
      const parts = lines[li % lines.length];
      const row = document.createElement("div");
      row.className = "fx__ln";
      const num = document.createElement("b");
      num.textContent = (li % lines.length) + 1;
      const code = document.createElement("span");
      const caret = document.createElement("i");
      caret.className = "fx__caret";
      row.append(num, code, caret);
      box.append(row);
      while (box.children.length > MAX) box.firstChild.remove();
      // digita token a token, caractere a caractere
      const tokens = parts.map((p) => { const m = /^([kscfn]):(.*)$/.exec(p); return m ? [m[1], m[2]] : ["", p]; });
      let ti = 0, ci = 0, span = null;
      const typeChar = () => {
        if (!running) return;
        if (ti >= tokens.length) {
          caret.remove();
          li++;
          if (li % lines.length === 0) { timer = setTimeout(() => { box.replaceChildren(); typeLine(); }, 2200); return; }
          timer = setTimeout(typeLine, 260);
          return;
        }
        const [cls, txt] = tokens[ti];
        if (!span) { span = document.createElement("span"); if (cls) span.className = cls; code.append(span); }
        span.textContent += txt.charAt(ci) || "";
        ci++;
        if (ci >= txt.length) { ti++; ci = 0; span = null; }
        timer = setTimeout(typeChar, 22 + Math.random() * 38);
      };
      typeChar();
    };
    return {
      play() { if (running) return; running = true; typeLine(); },
      pause() { running = false; clearTimeout(timer); }
    };
  };
  const startBiFx = (el) => {
    const NSV = "http://www.w3.org/2000/svg";
    let running = false, timer = 0;
    const build = () => {
      const bars = Array.from({ length: 12 }, (_, i) => 30 + Math.round(Math.random() * 60) + i * 2);
      const max = Math.max(...bars);
      const line = Array.from({ length: 9 }, (_, i) => [310 + i * 26, 212 - (Math.random() * 40 + i * 4)]);
      const segs = [[0.46, "#0B72D7"], [0.27, "#54B5FB"], [0.17, "#00DDFF"], [0.10, "#6B7A8D"]];
      const C = 2 * Math.PI * 34;
      let acc = 0;
      el.innerHTML = `<svg viewBox="0 0 540 340">
        <rect class="fx-bi__frame" style="--i:0" x="4" y="4" width="532" height="40" rx="10" pathLength="1"/>
        <rect x="20" y="17" width="5" height="14" rx="1" class="fx-bi__kpi" style="--i:0;fill:#0B72D7"/><rect x="28" y="13" width="5" height="18" rx="1" class="fx-bi__kpi" style="--i:0;fill:#54B5FB"/><rect x="36" y="9" width="5" height="22" rx="1" class="fx-bi__kpi" style="--i:0;fill:#00DDFF"/>
        ${[0, 1, 2, 3].map((i) => `<rect class="fx-bi__frame" style="--i:${i + 1}" x="${4 + i * 135}" y="56" width="125" height="62" rx="10" pathLength="1"/>
          <rect class="fx-bi__kpi" style="--i:${i}" x="${18 + i * 135}" y="70" width="${40 + (i % 2) * 20}" height="6" rx="3"/>
          <rect class="fx-bi__kpi" style="--i:${i}" x="${18 + i * 135}" y="86" width="${60 + ((i + 1) % 3) * 12}" height="16" rx="4"/>`).join("")}
        <rect class="fx-bi__frame" style="--i:5" x="4" y="130" width="280" height="206" rx="10" pathLength="1"/>
        ${bars.map((v, i) => `<rect class="fx-bi__bar${v === max ? " is-max" : ""}" style="--i:${i}" x="${20 + i * 21.5}" y="${320 - (v / max) * 160}" width="15" height="${(v / max) * 160}" rx="3"/>`).join("")}
        <rect class="fx-bi__frame" style="--i:6" x="294" y="130" width="242" height="96" rx="10" pathLength="1"/>
        <path class="fx-bi__line" pathLength="1" d="${line.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")}"/>
        <rect class="fx-bi__frame" style="--i:7" x="294" y="236" width="242" height="100" rx="10" pathLength="1"/>
        ${segs.map(([f, col], i) => { const len = f * C - 3; const c = `<circle class="fx-bi__ring" style="--i:${i};--len:${len};stroke:${col}" cx="350" cy="286" r="34" stroke-dashoffset="${-acc}"/>`; acc += f * C; return c; }).join("")}
        ${[0, 1, 2].map((i) => `<rect class="fx-bi__kpi" style="--i:${i + 2}" x="404" y="${262 + i * 16}" width="${90 - i * 18}" height="7" rx="3"/>`).join("")}
      </svg>`;
    };
    const cycle = () => {
      if (!running) return;
      el.classList.remove("is-drawing", "is-leaving");
      build();
      void el.offsetWidth;
      el.classList.add("is-drawing");
      timer = setTimeout(() => {
        el.classList.add("is-leaving");
        timer = setTimeout(cycle, 900);
      }, 7000);
    };
    return {
      play() { if (running) return; running = true; cycle(); },
      pause() { running = false; clearTimeout(timer); }
    };
  };
  const fxs = $$("[data-fx]").map((el) => ({ el, fx: el.dataset.fx === "bi" ? startBiFx(el) : startCodeFx(el) }));
  if ("IntersectionObserver" in window) {
    const fio = new IntersectionObserver((entries) => entries.forEach((en) => {
      const item = fxs.find((x) => x.el === en.target);
      if (en.isIntersecting) item.fx.play(); else item.fx.pause();
    }), { threshold: 0.05 });
    fxs.forEach((x) => fio.observe(x.el));
  }

  /* ---------- Títulos montados palavra por palavra ---------- */
  $$(".split-title").forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/)
      .map((w, i) => `<span class="w"><span style="--wi:${i}">${esc(w)}</span></span>`).join(" ");
    el.classList.add("reveal-raw");
  });

  /* ---------- Linha guia que se desenha com a rolagem ---------- */
  const sl = $("#scroll-line"), path = $("#scroll-path");
  if (sl && path) {
    const NSV = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(NSV, "defs");
    defs.innerHTML = '<linearGradient id="sl-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#34d399"/></linearGradient>';
    sl.prepend(defs);
    let len = 0, dots = [];
    const layout = () => {
      const main = $("#main");
      const mr = main.getBoundingClientRect();
      const cont = $(".container").getBoundingClientRect();
      const x = Math.max(28, cont.left - mr.left - 44);
      const kickers = $$("main .kicker");
      const mq = $("#marquee");
      const startY = mq ? mq.getBoundingClientRect().bottom - mr.top + 24 : 0;
      let d = `M ${x} ${startY}`;
      let prevY = startY;
      dots.forEach((n) => n.remove());
      dots = kickers.map((k, i) => {
        const r = k.getBoundingClientRect();
        const y = r.top - mr.top + r.height / 2;
        const bend = i % 2 ? 14 : -14;
        d += ` C ${x + bend} ${prevY + (y - prevY) * 0.35}, ${x - bend} ${prevY + (y - prevY) * 0.65}, ${x} ${y}`;
        prevY = y;
        const c = document.createElementNS(NSV, "circle");
        c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 5); c.setAttribute("class", "sl-dot");
        c.dataset.y = y;
        sl.append(c);
        return c;
      });
      d += ` L ${x} ${main.offsetHeight - 40}`;
      path.setAttribute("d", d);
      len = path.getTotalLength();
      path.style.strokeDasharray = len;
      draw();
    };
    // A linha persegue o ponto de leitura com suavização, então desenha e "apaga" de forma contínua.
    let target = 0, current = 0, raf = 0;
    const lengthAt = (reach) => {
      let lo = 0, hi = len;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y < reach) lo = mid; else hi = mid; }
      return lo;
    };
    const tick = () => {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.5) current = target;
      path.style.strokeDashoffset = len - current;
      const tip = path.getPointAtLength(current);
      dots.forEach((c) => c.classList.toggle("is-on", Number(c.dataset.y) <= tip.y + 1));
      raf = current === target ? 0 : requestAnimationFrame(tick);
    };
    const draw = () => {
      if (!len) return;
      const mr = $("#main").getBoundingClientRect();
      target = lengthAt(window.innerHeight * 0.6 - mr.top);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);
    setTimeout(layout, 300);
  }

  /* ---------- Animações de entrada (com escalonamento) ---------- */
  $$(".grid, .timeline, .dash-list, .timeline__roles, .cases, .steps, .models").forEach((g) => {
    [...g.children].forEach((c, i) => c.style.setProperty("--stagger", `${(i % 6) * 90}ms`));
  });

  const revealEls = $$(".reveal, .split-title");
  const statsDone = { v: false };
  const startStats = () => {
    if (statsDone.v) return;
    statsDone.v = true;
    $$("#hero-stats strong").forEach((n, i) => setTimeout(() => runCounter(n), i * 150));
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          if (en.target.classList.contains("hero__text")) startStats();
          if (en.target.classList.contains("case")) { const n = en.target.querySelector(".case__metric strong"); setTimeout(() => runCounter(n, 1400), 300); }
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    startStats();
  }
})();
