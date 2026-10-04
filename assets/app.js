// elevraa. brand audit & growth plan renderer.
// Each brand folder holds an index.html + data.json; this file turns the
// JSON into the page. Every section is optional: leave a key out to hide it.

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Plain text with two light conventions: **bold** and *serif accent*.
const fmt = (s = "") =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, '<span class="serif">$1</span>');

const STATUS = {
  working: { label: "Working", icon: "✓" },
  gap: { label: "Underused", icon: "!" },
  missing: { label: "Missing", icon: "✕" },
};

const LOGO = (cls = "") => `<a class="logo ${cls}" href="https://elevraa.com" target="_blank" rel="noopener" aria-label="elevraa."><span>elevraa</span><i></i></a>`;

const list = (arr) => (Array.isArray(arr) && arr.length ? arr : null);

function sectionHead(n, eyebrow, title, sub) {
  return `<div class="head reveal">
    <div class="eyebrow"><span class="num">${String(n).padStart(2, "0")}</span>${esc(eyebrow)}</div>
    <h2 class="title">${fmt(title)}</h2>
    ${sub ? `<p class="sub">${fmt(sub)}</p>` : ""}
  </div>`;
}

function render(d) {
  const brand = d.brand || {};
  const meta = d.meta || {};
  const sections = [];
  let n = 0;
  const add = (id, nav, html, alt = false) => {
    sections.push({ id, nav, html: `<section class="block${alt ? " alt" : ""}" id="${id}"><div class="wrap">${html}</div></section>` });
  };

  /* ----- Summary ----- */
  if (d.summary) {
    const s = d.summary;
    add("summary", "Summary", `
      ${sectionHead(++n, "The short version", s.title || `Where *${brand.name}* stands today`, s.sub)}
      <div class="verdict reveal">
        <div>
          <div class="label">Our read</div>
          <blockquote>${fmt(s.verdict)}</blockquote>
        </div>
        ${list(s.stats) ? `<div class="stats">${s.stats.map((x) => `<div class="stat"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`).join("")}</div>` : ""}
      </div>`);
  }

  /* ----- Goals ----- */
  if (list(d.goals)) {
    add("goals", "Goals", `
      ${sectionHead(++n, "What you asked for", "Your goals, and where each one is *answered*", "Every recommendation in this plan maps back to something you told us matters.")}
      <table class="table reveal">
        <thead><tr><th>Your goal</th><th>Where it lives in this plan</th></tr></thead>
        <tbody>${d.goals.map((g, i) => `<tr><td>${i + 1}. ${fmt(g.goal)}</td><td>${fmt(g.where)}</td></tr>`).join("")}</tbody>
      </table>`, true);
  }

  /* ----- Scorecard ----- */
  if (list(d.scorecard)) {
    add("scorecard", "Scorecard", `
      ${sectionHead(++n, "Channel scorecard", "How each channel is *performing*", "Scored out of 10 against what a category leader in your space would be doing today.")}
      <div class="score-list">
        ${d.scorecard.map((c) => {
          const st = STATUS[c.status] || STATUS.gap;
          const pct = Math.max(0, Math.min(10, Number(c.score) || 0)) * 10;
          return `<div class="score-row reveal">
            <div class="name">${esc(c.channel)}${c.note ? `<span class="note">${esc(c.note)}</span>` : ""}</div>
            <div class="bar ${esc(c.status)}"><i data-w="${pct}%"></i></div>
            <div class="val">${esc(c.score)}/10 <span class="pill ${esc(c.status)}">${st.label}</span></div>
          </div>`;
        }).join("")}
      </div>`);
  }

  /* ----- Diagnosis: working / not doing / missing ----- */
  if (list(d.working) || list(d.notDoing) || list(d.missing)) {
    const col = (key, items, title, hint) =>
      list(items)
        ? `<div class="diag-col ${key} reveal">
            <header><span class="ico">${STATUS[key].icon}</span><div><h3>${title}</h3><small>${hint}</small></div></header>
            ${items.map((x) => `<div class="diag-item">
              <h4><span>${fmt(x.title)}</span>${x.impact ? `<span class="pill ${esc(String(x.impact).toLowerCase())}">${esc(x.impact)} impact</span>` : ""}</h4>
              ${x.detail ? `<p>${fmt(x.detail)}</p>` : ""}
            </div>`).join("")}
          </div>`
        : "";
    add("diagnosis", "Diagnosis", `
      ${sectionHead(++n, "The diagnosis", d.diagnosisTitle || "What's working, what you're *not doing*, and what's missing", d.diagnosisSub)}
      <div class="diag">
        ${col("working", d.working, "What's working", "Keep and build on")}
        ${col("gap", d.notDoing, "What you're not doing", "Opportunities left on the table")}
        ${col("missing", d.missing, "What's missing", "Gaps buyers will notice")}
      </div>`, true);
  }

  /* ----- Channel deep dives ----- */
  if (list(d.channels)) {
    const tabs = d.channels.map((c, i) => `<button class="tab" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}"><span class="dot ${esc(c.status || "gap")}"></span>${esc(c.name)}</button>`).join("");
    const panels = d.channels.map((c, i) => `
      <div class="panel${i === 0 ? " show" : ""}" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}">
        <div class="panel-head">
          <div><h3>${esc(c.name)}</h3>${c.summary ? `<p>${fmt(c.summary)}</p>` : ""}</div>
          ${c.status ? `<span class="pill ${esc(c.status)}">${(STATUS[c.status] || STATUS.gap).label}</span>` : ""}
        </div>
        <div class="grid g2">
          ${list(c.audit) ? `<div class="card"><p class="sub-h">Current state</p><ol class="obs">${c.audit.map((a) => `<li><span>${fmt(a)}</span></li>`).join("")}</ol></div>` : ""}
          <div class="grid" style="align-content:start">
            ${list(c.plan) ? `<div class="card"><p class="sub-h">What we'll do</p><ol class="obs">${c.plan.map((p) => `<li><span>${p.title ? `<strong>${fmt(p.title)}.</strong> ` : ""}${fmt(p.detail || p)}</span></li>`).join("")}</ol></div>` : ""}
            ${list(c.kpis) ? `<div class="card"><p class="sub-h">How we'll measure it</p><div class="kpis">${c.kpis.map((k) => `<div class="kpi"><span>${esc(k.metric)}</span><b>${esc(k.target)}</b></div>`).join("")}</div></div>` : ""}
          </div>
        </div>
      </div>`).join("");
    add("channels", "Channels", `
      ${sectionHead(++n, "Channel deep dives", "Channel by channel: today, and the *plan*", "Pick a channel to see what we found and exactly what we'd change.")}
      <div class="tabs" role="tablist">${tabs}</div>
      ${panels}`);
  }

  /* ----- What elevraa. will do ----- */
  if (list(d.services)) {
    add("services", "Services", `
      ${sectionHead(++n, "What elevraa. will do", d.servicesTitle || `How we'd help *${brand.name}* win`, d.servicesSub)}
      <div class="grid ${d.services.length % 3 === 0 ? "g3" : "g2"}">
        ${d.services.map((s, i) => `<div class="card svc reveal${s.featured ? " featured" : ""}">
          <div class="idx">${String(i + 1).padStart(2, "0")}</div>
          <h3 style="margin-top:14px">${fmt(s.title)}</h3>
          ${s.detail ? `<p>${fmt(s.detail)}</p>` : ""}
          ${list(s.deliverables) ? `<ul>${s.deliverables.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>` : ""}
        </div>`).join("")}
      </div>`, true);
  }

  /* ----- Roadmap ----- */
  if (list(d.roadmap)) {
    add("roadmap", "Roadmap", `
      ${sectionHead(++n, "The roadmap", d.roadmapTitle || "Your first *90 days*", d.roadmapSub)}
      <div class="road">
        ${d.roadmap.map((p) => `<div class="phase reveal">
          <span class="when">${esc(p.phase)}</span>
          <h3>${fmt(p.title)}</h3>
          ${list(p.items) ? `<ul>${p.items.map((x) => `<li><span>${fmt(x)}</span></li>`).join("")}</ul>` : ""}
          ${p.outcome ? `<div class="out"><b>By the end</b>${fmt(p.outcome)}</div>` : ""}
        </div>`).join("")}
      </div>`);
  }

  /* ----- Outcomes ----- */
  if (list(d.outcomes)) {
    add("outcomes", "Outcomes", `
      ${sectionHead(++n, "Expected outcomes", d.outcomesTitle || "What success looks like at *day 90*", d.outcomesSub)}
      <div class="grid g4">
        ${d.outcomes.map((o) => `<div class="card outcome reveal"><b>${esc(o.value)}</b><span>${fmt(o.label)}</span></div>`).join("")}
      </div>`, true);
  }

  /* ----- What we need ----- */
  if (list(d.needs)) {
    add("needs", "Needs", `
      ${sectionHead(++n, "What we need from you", "To start in *week one*", "Small asks that make everything above move faster.")}
      <div class="needs">${d.needs.map((x) => `<div class="need reveal"><span class="box"></span><span>${fmt(x)}</span></div>`).join("")}</div>`);
  }

  /* ----- Investment ----- */
  if (d.investment && list(d.investment.options)) {
    const inv = d.investment;
    add("investment", "Pricing", `
      ${sectionHead(++n, "Investment", inv.title || "Ways to *work together*", inv.sub)}
      <div class="grid ${inv.options.length === 3 ? "g3" : "g2"}">
        ${inv.options.map((o) => `<div class="card price svc reveal${o.featured ? " featured" : ""}">
          ${o.featured ? `<span class="tag">Recommended</span>` : ""}
          <h3>${esc(o.name)}</h3>
          <div class="amt">${esc(o.price)} ${o.per ? `<small>${esc(o.per)}</small>` : ""}</div>
          ${o.detail ? `<p>${fmt(o.detail)}</p>` : ""}
          ${list(o.includes) ? `<ul>${o.includes.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>` : ""}
        </div>`).join("")}
      </div>
      ${inv.note ? `<p class="sub" style="font-size:14px">${fmt(inv.note)}</p>` : ""}`, true);
  }

  /* ----- Page shell ----- */
  const cta = d.cta || {};
  const ctaLink = cta.link || "https://calendly.com/nisarg-elevraa/30min";
  const initials = esc((brand.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase());

  document.title = `${brand.name || "Brand"} ${meta.title || "Growth Plan"} | elevraa.`;

  document.getElementById("app").innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        ${LOGO()}
        <nav aria-label="Sections">${sections.map((s) => `<a href="#${s.id}">${esc(s.nav)}</a>`).join("")}</nav>
        <a class="btn" href="${esc(ctaLink)}" target="_blank" rel="noopener">${esc(cta.button || "Book a call")}</a>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="wrap">
          <div class="prepared reveal">
            <span class="mark">${brand.logo ? `<img src="${esc(brand.logo)}" alt="">` : initials}</span>
            <span>Prepared for <b>${esc(brand.name)}</b></span>${brand.industry ? `<span class="ind">${esc(brand.industry)}</span>` : ""}
          </div>
          <h1 class="reveal">${fmt(d.hero?.headline || `${brand.name}: *growth plan*`)}</h1>
          ${d.hero?.intro ? `<p class="lead reveal">${fmt(d.hero.intro)}</p>` : ""}
          <div class="hero-meta reveal">
            ${meta.title ? `<span><b>${esc(meta.title)}</b></span>` : ""}
            ${meta.preparedBy ? `<span>Prepared by <b>${esc(meta.preparedBy)}</b></span>` : ""}
            ${meta.date ? `<span>${esc(meta.date)}</span>` : ""}
            ${brand.website ? `<span><a href="https://${esc(brand.website.replace(/^https?:\/\//, ""))}" target="_blank" rel="noopener">${esc(brand.website.replace(/^https?:\/\//, ""))}</a></span>` : ""}
          </div>
          <div class="hero-actions reveal">
            ${sections[0] ? `<a class="btn dark" href="#${sections[0].id}">Read the plan ↓</a>` : ""}
            <button class="btn ghost" onclick="window.print()">Save as PDF</button>
          </div>
        </div>
      </section>

      ${sections.map((s) => s.html).join("")}

      <section class="block" id="next">
        <div class="cta reveal">
          <h2>${fmt(cta.title || "Let's make you the *obvious choice*.")}</h2>
          <p>${fmt(cta.text || "A 30-minute call to walk through this plan, pressure-test it against your numbers, and agree on what ships first.")}</p>
          <a class="btn" href="${esc(ctaLink)}" target="_blank" rel="noopener">${esc(cta.button || "Book a call")} →</a>
        </div>
      </section>
    </main>

    <footer class="foot">
      <div class="wrap">
        <div class="row">
          <div>${LOGO("light")}<p>B2B messaging, content, and ABM that make buyers remember you, prefer you, and choose you.</p></div>
          <div style="text-align:right">
            ${cta.email !== "" ? `<a href="mailto:${esc(cta.email || "nisarg@elevraa.com")}">${esc(cta.email || "nisarg@elevraa.com")}</a><br>` : ""}
            <a href="https://elevraa.com" target="_blank" rel="noopener">elevraa.com</a>
          </div>
        </div>
        <div class="fine">${fmt(d.footnote || `Prepared exclusively for ${brand.name}. Figures and timelines are proposed starting points, open to revision once we align.`)}</div>
      </div>
    </footer>`;

  wire();
}

function wire() {
  // Channel tabs
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((t, i) =>
    t.addEventListener("click", () => {
      tabs.forEach((x, j) => {
        x.setAttribute("aria-selected", String(i === j));
        document.getElementById(`panel-${j}`).classList.toggle("show", i === j);
      });
    })
  );

  // Reveal on scroll + score bars
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll(".bar > i").forEach((b) => (b.style.width = b.dataset.w));
        io.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // Active section in the top nav
  const links = new Map([...document.querySelectorAll(".topbar nav a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        links.get(e.target.id)?.classList.add("active");
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("section.block[id]").forEach((s) => spy.observe(s));

  // Printing should show everything, including bars
  window.addEventListener("beforeprint", () =>
    document.querySelectorAll(".bar > i").forEach((b) => (b.style.width = b.dataset.w))
  );
}

fetch("data.json", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error(`data.json: HTTP ${r.status}`);
    return r.json();
  })
  .then(render)
  .catch((err) => {
    document.getElementById("app").innerHTML = `<div class="wrap" style="padding:80px 20px"><h1 class="garet">Couldn't load this plan</h1><p class="sub">${esc(err.message)}. Check that data.json sits next to index.html and is valid JSON.</p></div>`;
  });
