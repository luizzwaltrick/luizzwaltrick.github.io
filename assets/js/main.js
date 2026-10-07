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

  /* ---------- Perfil ---------- */
  $$("[data-bind]").forEach((el) => { el.textContent = p[el.dataset.bind] || ""; });
  $("#about-text").innerHTML = p.about.map((t) => `<p>${esc(t)}</p>`).join("");
  document.title = `${p.name} · ${p.role}`;

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

  /* ---------- Formação e certificações ---------- */
  const EDU_ICON = '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>';
  const CERT_ICON = '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>';
  const svgIcon = (d) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  $("#education").innerHTML = `
    <div class="edu__col">
      <h3>Graduação</h3>
      ${(data.education || []).map((e) => `
        <article class="edu__card draw reveal">
          <div class="edu__badge">${svgIcon(EDU_ICON)}</div>
          <div>
            <h4>${esc(e.title)}</h4>
            <p>${esc(e.degree)} · ${esc(e.school)}</p>
            <span class="edu__period">${esc(e.period)}</span>
            ${e.tags && e.tags.length ? tags(e.tags) : ""}
          </div>
        </article>`).join("")}
    </div>
    <div class="edu__col">
      <h3>Certificações</h3>
      <ul class="cert">
        ${(data.certifications || []).map((c) => `
          <li class="draw reveal">
            <span class="cert__icon">${svgIcon(CERT_ICON)}</span>
            <div><strong>${esc(c.title)}</strong><span>${esc(c.issuer)}</span></div>
            <em>${esc(c.year || "")}</em>
          </li>`).join("")}
      </ul>
    </div>`;

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
      let d = `M ${x} 0`;
      let prevY = 0;
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
    const draw = () => {
      if (!len) return;
      const mr = $("#main").getBoundingClientRect();
      const reach = window.innerHeight * 0.6 - mr.top; // até onde a linha já chegou (em px dentro do main)
      let lo = 0, hi = len;
      for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y < reach) lo = mid; else hi = mid; }
      path.style.strokeDashoffset = len - lo;
      dots.forEach((c) => c.classList.toggle("is-on", Number(c.dataset.y) < reach));
    };
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", layout);
    window.addEventListener("load", layout);
    setTimeout(layout, 300);
  }

  /* ---------- Animações de entrada (com escalonamento) ---------- */
  $$(".grid, .timeline, .dash-list, .timeline__roles, .cert").forEach((g) => {
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
