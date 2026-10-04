// elevraa. brand audit & growth plan renderer (v2).
// Each brand folder holds index.html + data.json; this file turns the JSON
// into the page. Every section is optional: leave a key out to hide it.
// Charts are hand-built SVG so pages stay light and print cleanly.

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Plain text with two light conventions: **bold** and *serif accent*.
const fmt = (s = "") =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, '<span class="serif">$1</span>');

const list = (arr) => (Array.isArray(arr) && arr.length ? arr : null);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const r1 = (v) => Math.round(v * 10) / 10;

const STATUS = {
  working: { label: "Working", icon: "✓" },
  gap: { label: "Underused", icon: "!" },
  missing: { label: "Missing", icon: "✕" },
};

// Chart series colours, from the brand guidelines palette.
const SERIES = ["#201e2b", "#ecee81", "#9fc7b9", "#c9cc3f", "#8b8a99", "#e5f1c3", "#d9d9d9"];

const LOGO = (cls = "") =>
  `<a class="logo ${cls}" href="https://elevraa.com" target="_blank" rel="noopener" aria-label="elevraa."><span>elevraa</span><i></i></a>`;

/* =================================================================
   Chart builders
   ================================================================= */

function gauge(value, max = 10, bench, size = 120) {
  const r = 48, c = 2 * Math.PI * r;
  const pct = clamp(num(value) / max, 0, 1);
  let benchMark = "";
  if (bench !== undefined) {
    const a = (clamp(num(bench) / max, 0, 1) * 360 - 90) * (Math.PI / 180);
    const x1 = 60 + Math.cos(a) * 40, y1 = 60 + Math.sin(a) * 40;
    const x2 = 60 + Math.cos(a) * 58, y2 = 60 + Math.sin(a) * 58;
    benchMark = `<line class="bench" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke-linecap="round"/>`;
  }
  return `<svg class="gauge" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="Score ${esc(value)} out of ${max}">
    <circle class="track" cx="60" cy="60" r="${r}" fill="none" stroke-width="12"/>
    <circle class="val" cx="60" cy="60" r="${r}" fill="none" stroke-width="12"
      stroke-dasharray="${r1(c)}" stroke-dashoffset="${r1(c)}" data-off="${r1(c * (1 - pct))}" transform="rotate(-90 60 60)"/>
    ${benchMark}
    <text x="60" y="58" text-anchor="middle" font-size="30">${esc(value)}</text>
    <text x="60" y="78" text-anchor="middle" font-size="11" style="font-family:Inter;font-weight:500;fill:#71717a">out of ${max}</text>
  </svg>`;
}

function radar(axes, series, max = 10) {
  const W = 460, H = 400, cx = W / 2, cy = H / 2 + 6, R = 138, n = axes.length;
  const pt = (i, v) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (clamp(num(v), 0, max) / max) * R;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  };
  const rings = [0.2, 0.4, 0.6, 0.8, 1]
    .map((f) => `<polygon class="grid-line" fill="none" points="${axes.map((_, i) => pt(i, f * max).map(r1).join(",")).join(" ")}"/>`)
    .join("");
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, max); return `<line class="grid-line" x1="${cx}" y1="${cy}" x2="${r1(x)}" y2="${r1(y)}"/>`; }).join("");
  const labels = axes.map((ax, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const x = cx + Math.cos(a) * (R + 26), y = cy + Math.sin(a) * (R + 22);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    return `<text class="axis-label" x="${r1(x)}" y="${r1(y + 4)}" text-anchor="${anchor}">${esc(ax)}</text>`;
  }).join("");
  const colorOf = (i) => SERIES[(i % (SERIES.length - 2)) + 2];
  // Draw benchmarks first so the brand sits on top.
  const ordered = series.map((s, i) => ({ ...s, i })).sort((a, b) => (a.me ? 1 : 0) - (b.me ? 1 : 0));
  const shapes = ordered.map((s) => {
    const pts = s.values.map((v, i) => pt(i, v).map(r1).join(",")).join(" ");
    if (s.me) {
      return `<g class="pop"><polygon points="${pts}" fill="#ecee81" fill-opacity=".6" stroke="#201e2b" stroke-width="2.5" stroke-linejoin="round"/>
        ${s.values.map((v, i) => { const [x, y] = pt(i, v); return `<circle cx="${r1(x)}" cy="${r1(y)}" r="4.5" fill="#201e2b"/>`; }).join("")}</g>`;
    }
    return `<polygon class="pop" points="${pts}" fill="none" stroke="${colorOf(s.i)}" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round"/>`;
  }).join("");
  const legend = series.map((s, i) => s.me
    ? `<span><i style="background:#ecee81;border:2px solid #201e2b"></i>${esc(s.name)}</span>`
    : `<span><i class="dash" style="border-color:${colorOf(i)}"></i>${esc(s.name)}</span>`).join("");
  return `<svg class="chart radar" viewBox="0 0 ${W} ${H}" role="img" aria-label="Benchmark radar chart">${rings}${spokes}${shapes}${labels}</svg>
    <div class="legend">${legend}</div>`;
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v) || 10 * p;
}

function lineChart(p) {
  const W = 680, H = 320, L = 48, Rt = 70, T = 18, B = 40;
  const labels = p.labels || [];
  const all = p.series.flatMap((s) => s.values.map(num));
  const ymax = niceMax(Math.max(...all) * 1.05);
  const x = (i) => L + (i * (W - L - Rt)) / Math.max(1, labels.length - 1);
  const y = (v) => T + (1 - num(v) / ymax) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = ymax * f, yy = y(v);
    return `<line class="grid-line" x1="${L}" x2="${W - Rt}" y1="${r1(yy)}" y2="${r1(yy)}"/><text x="${L - 10}" y="${r1(yy + 4)}" text-anchor="end">${esc(Math.round(v).toLocaleString())}</text>`;
  }).join("");
  const xl = labels.map((l, i) => `<text x="${r1(x(i))}" y="${H - 14}" text-anchor="middle">${esc(l)}</text>`).join("");
  let defs = "", body = "";
  p.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => [x(i), y(v)]);
    const d = pts.map(([a, b], i) => `${i ? "L" : "M"}${r1(a)},${r1(b)}`).join(" ");
    let len = 0;
    pts.forEach(([a, b], i) => { if (i) len += Math.hypot(a - pts[i - 1][0], b - pts[i - 1][1]); });
    const plan = s.style !== "baseline";
    const [lx, ly] = pts[pts.length - 1];
    if (plan) {
      defs += `<linearGradient id="lg${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecee81" stop-opacity=".75"/><stop offset="1" stop-color="#ecee81" stop-opacity="0"/></linearGradient>`;
      body += `<path class="pop" d="${d} L${r1(lx)},${y(0)} L${L},${y(0)} Z" fill="url(#lg${si})"/>`;
    }
    body += `<path class="draw" style="--len:${Math.ceil(len)}" d="${d}" fill="none" stroke="${plan ? "#201e2b" : "#8b8a99"}" stroke-width="${plan ? 3 : 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
    body += pts.map(([a, b]) => `<circle class="pop" cx="${r1(a)}" cy="${r1(b)}" r="${plan ? 4 : 3}" fill="${plan ? "#201e2b" : "#8b8a99"}"/>`).join("");
    body += `<text x="${r1(lx + 10)}" y="${r1(ly + 4)}" style="font-weight:700;fill:${plan ? "#201e2b" : "#71717a"}">${esc(num(s.values[s.values.length - 1]).toLocaleString())}${esc(p.unit || "")}</text>`;
  });
  const legend = p.series.map((s) => `<span><i style="background:${s.style === "baseline" ? "#8b8a99" : "#201e2b"};height:3px"></i>${esc(s.name)}</span>`).join("");
  return `<svg class="chart line" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.metric || "Projection")} projection"><defs>${defs}</defs>${ticks}${xl}${body}</svg><div class="legend">${legend}</div>`;
}

function donut(items, center) {
  const r = 70, sw = 26, c = 2 * Math.PI * r;
  const total = items.reduce((t, x) => t + num(x.pct), 0) || 1;
  let acc = 0;
  const segs = items.map((x, i) => {
    const frac = num(x.pct) / total, len = Math.max(0, frac * c - 3);
    const seg = `<circle cx="90" cy="90" r="${r}" fill="none" stroke="${SERIES[i % SERIES.length]}" stroke-width="${sw}"
      stroke-dasharray="${r1(len)} ${r1(c)}" stroke-dashoffset="${r1(-acc * c)}" transform="rotate(-90 90 90)"/>`;
    acc += frac;
    return seg;
  }).join("");
  return `<svg class="pop" width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Content mix">${segs}
    ${center ? `<text x="90" y="88" text-anchor="middle" style="font-family:Garet;font-weight:800;font-size:28px;fill:#201e2b">${esc(center.value)}</text>
    <text x="90" y="108" text-anchor="middle" style="font-size:11.5px;fill:#71717a">${esc(center.label)}</text>` : ""}</svg>`;
}

function quadrant(impact, effort) {
  const hi = num(impact) >= 5.5, easy = num(effort) < 5.5;
  if (hi && easy) return ["q-quick", "Quick win"];
  if (hi) return ["q-big", "Big bet"];
  if (easy) return ["q-fill", "Fill-in"];
  return ["q-later", "Later"];
}

function matrix(items) {
  const W = 460, H = 420, L = 40, R = 16, T = 36, B = 40;
  const pw = W - L - R, ph = H - T - B;
  const x = (e) => L + (clamp(num(e), 0, 10) / 10) * pw;
  const y = (i) => T + (1 - clamp(num(i), 0, 10) / 10) * ph;
  const mx = L + pw / 2, my = T + ph / 2;
  const quads = `
    <rect x="${L}" y="${T}" width="${pw / 2 - 3}" height="${ph / 2 - 3}" rx="14" fill="#fbfce8"/>
    <rect x="${mx + 3}" y="${T}" width="${pw / 2 - 3}" height="${ph / 2 - 3}" rx="14" fill="#e9f1ee"/>
    <rect x="${L}" y="${my + 3}" width="${pw / 2 - 3}" height="${ph / 2 - 3}" rx="14" fill="#f5f5f5"/>
    <rect x="${mx + 3}" y="${my + 3}" width="${pw / 2 - 3}" height="${ph / 2 - 3}" rx="14" fill="#fafafa"/>
    <text class="quad-label" x="${L + 4}" y="${T - 12}" style="fill:#8a8c1f">QUICK WINS</text>
    <text class="quad-label" x="${W - R - 4}" y="${T - 12}" text-anchor="end" style="fill:#201e2b">BIG BETS</text>
    <text class="quad-label" x="${L + 12}" y="${H - B - 12}" style="fill:#71717a">FILL-INS</text>
    <text class="quad-label" x="${W - R - 12}" y="${H - B - 12}" text-anchor="end" style="fill:#a1a1aa">LATER</text>
    <text x="${L + pw / 2}" y="${H - 10}" text-anchor="middle" class="axis-label">Effort →</text>
    <text x="14" y="${T + ph / 2}" text-anchor="middle" class="axis-label" transform="rotate(-90 14 ${T + ph / 2})">Impact →</text>`;
  const dots = items.map((it, i) => `<g class="pop" style="transition-delay:${i * 60}ms">
      <circle cx="${r1(x(it.effort))}" cy="${r1(y(it.impact))}" r="15" fill="#201e2b"/>
      <text x="${r1(x(it.effort))}" y="${r1(y(it.impact) + 4.5)}" text-anchor="middle" style="fill:#ecee81;font-weight:700;font-size:12.5px">${i + 1}</text></g>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Impact versus effort matrix">${quads}${dots}</svg>`;
}

/* =================================================================
   Page
   ================================================================= */

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
  let alt = false;
  // group = the top-menu entry this section belongs to
  const add = (id, group, html) => {
    sections.push({ id, group, html: `<section class="block${alt ? " alt" : ""}" id="${id}" data-group="${esc(group)}"><div class="wrap">${html}</div></section>` });
    alt = !alt;
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
    add("goals", "Summary", `
      ${sectionHead(++n, "What you asked for", "Your goals, and where each one is *answered*", "Every recommendation in this plan maps back to something you told us matters.")}
      <table class="table reveal">
        <thead><tr><th>Your goal</th><th>Where it lives in this plan</th></tr></thead>
        <tbody>${d.goals.map((g, i) => `<tr><td>${i + 1}. ${fmt(g.goal)}</td><td>${fmt(g.where)}</td></tr>`).join("")}</tbody>
      </table>`);
  }

  /* ----- Benchmark: radar + share of voice + feature comparison ----- */
  const b = d.benchmark;
  if (b && (b.radar || list(b.shareOfVoice) || b.compare)) {
    const radarHtml = b.radar && list(b.radar.axes) && list(b.radar.series)
      ? `<div class="chart-card reveal"><h3>${esc(b.radar.title || "Brand strength vs. competitors")}</h3><p class="hint">${esc(b.radar.hint || "Scored 0-10 on each dimension buyers judge you on.")}</p>${radar(b.radar.axes, b.radar.series)}</div>` : "";
    const sovMax = list(b.shareOfVoice) ? Math.max(...b.shareOfVoice.map((x) => num(x.value))) : 1;
    const sovHtml = list(b.shareOfVoice)
      ? `<div class="chart-card reveal"><h3>${esc(b.sovTitle || "Share of voice")}</h3><p class="hint">${esc(b.sovHint || "Share of category conversation on LinkedIn over the last 90 days.")}</p>
          <div class="sov">${b.shareOfVoice.map((x) => `<div class="sov-row${x.me ? " me" : ""}"><span>${esc(x.name)}</span><div class="bar"><i class="grow" style="width:${(num(x.value) / sovMax) * 100}%"></i></div><b>${esc(x.value)}${esc(b.sovUnit ?? "%")}</b></div>`).join("")}</div>
          ${b.sovNote ? `<p class="hint" style="margin-top:16px">${fmt(b.sovNote)}</p>` : ""}</div>` : "";
    const cmp = b.compare;
    const chip = (v) => ({ yes: '<span class="chip yes" title="Yes">✓</span>', part: '<span class="chip part" title="Partly">~</span>', no: '<span class="chip no" title="No">✕</span>' })[v] || esc(v);
    const cmpHtml = cmp && list(cmp.columns) && list(cmp.rows)
      ? `<div class="chart-card reveal" style="margin-top:16px"><h3>${esc(cmp.title || "What buyers see when they compare you")}</h3><p class="hint">✓ doing it well · ~ partly · ✕ not doing it</p>
          <div class="scroll-x"><table class="compare" style="margin-top:18px"><thead><tr><th></th>${cmp.columns.map((c, i) => `<th class="${i === 0 ? "me" : ""}">${esc(c)}</th>`).join("")}</tr></thead>
          <tbody>${cmp.rows.map((r) => `<tr><td>${fmt(r.feature)}</td>${r.values.map((v, i) => `<td class="${i === 0 ? "me" : ""}">${chip(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>` : "";
    add("benchmark", "Benchmark", `
      ${sectionHead(++n, "The benchmark", b.title || "How you *compare*", b.sub)}
      <div class="grid g2" style="align-items:stretch">${radarHtml}${sovHtml}</div>
      ${cmpHtml}`);
  }

  /* ----- Scorecard ----- */
  if (list(d.scorecard)) {
    const hasTarget = d.scorecard.some((c) => c.target !== undefined);
    add("scorecard", "Benchmark", `
      ${sectionHead(++n, "Channel scorecard", "How each channel is *performing*", `Scored out of 10 against what a category leader in your space would be doing today.${hasTarget ? " The yellow marker is where we'll take it in 90 days." : ""}`)}
      <div class="score-list">
        ${d.scorecard.map((c) => {
          const st = STATUS[c.status] || STATUS.gap;
          const pct = clamp(num(c.score), 0, 10) * 10;
          return `<div class="score-row reveal">
            <div class="name">${esc(c.channel)}${c.note ? `<span class="note">${esc(c.note)}</span>` : ""}</div>
            <div class="bar ${esc(c.status)}"><i data-w="${pct}%"></i>${c.target !== undefined ? `<span class="target" style="left:${clamp(num(c.target), 0, 10) * 10}%" title="90-day target ${esc(c.target)}/10"></span>` : ""}</div>
            <div class="val">${esc(c.score)}/10${c.target !== undefined ? ` <span style="color:var(--muted);font-weight:500">→ ${esc(c.target)}</span>` : ""} <span class="pill ${esc(c.status)}">${st.label}</span></div>
          </div>`;
        }).join("")}
      </div>`);
  }

  /* ----- Diagnosis ----- */
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
      </div>`);
  }

  /* ----- Funnel ----- */
  if (d.funnel && list(d.funnel.stages)) {
    const st = d.funnel.stages, k = st.length;
    add("funnel", "Diagnosis", `
      ${sectionHead(++n, "The buyer journey", d.funnel.title || "Where your pipeline *leaks*", d.funnel.sub)}
      <div class="funnel">
        ${st.map((s, i) => `
          <div class="f-row reveal">
            <div class="f-shape ${esc(s.status || "")}" style="width:${100 - (i * 55) / Math.max(1, k - 1)}%">${esc(s.stage)}</div>
            <div class="f-info">
              <div class="num">${esc(s.value)}<small>${esc(s.metric || "")}</small></div>
              <div>${s.status ? `<span class="pill ${esc(s.status)}">${(STATUS[s.status] || STATUS.gap).label}</span>` : ""}<p>${fmt(s.note || "")}</p></div>
            </div>
          </div>
          ${s.leak && i < k - 1 ? `<div class="f-row"><div class="leak">↓ ${esc(s.leak)}</div><div></div></div>` : ""}`).join("")}
      </div>`);
  }

  /* ----- Channels ----- */
  if (list(d.channels)) {
    const tabs = d.channels.map((c, i) => `<button class="tab" role="tab" id="tab-${i}" aria-controls="panel-${i}" aria-selected="${i === 0}"><span class="dot ${esc(c.status || "gap")}"></span>${esc(c.name)}</button>`).join("");
    const panels = d.channels.map((c, i) => `
      <div class="panel${i === 0 ? " show" : ""}" role="tabpanel" id="panel-${i}" aria-labelledby="tab-${i}">
        <div class="panel-head">
          <div><h3>${esc(c.name)}</h3>${c.summary ? `<p>${fmt(c.summary)}</p>` : ""}</div>
          <div class="mini-score">
            ${c.score !== undefined ? gauge(c.score, 10, c.target, 76) : ""}
            <div>${c.status ? `<span class="pill ${esc(c.status)}">${(STATUS[c.status] || STATUS.gap).label}</span>` : ""}${c.target !== undefined ? `<small style="margin-top:6px">90-day target: <b>${esc(c.target)}/10</b></small>` : ""}</div>
          </div>
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

  /* ----- Priorities matrix ----- */
  if (list(d.priorities)) {
    add("priorities", "Plan", `
      ${sectionHead(++n, "Priorities", d.prioritiesTitle || "What to do *first*", d.prioritiesSub || "Every initiative plotted by impact on pipeline against effort to ship. We start top-left.")}
      <div class="matrix-wrap">
        <div class="chart-card reveal">${matrix(d.priorities)}</div>
        <ol class="init-list reveal">
          ${d.priorities.map((p, i) => { const [cls, lab] = quadrant(p.impact, p.effort); return `<li><span class="n">${i + 1}</span><span>${fmt(p.label)}</span><span class="q ${cls}">${lab}</span></li>`; }).join("")}
        </ol>
      </div>`);
  }

  /* ----- Content engine: mix donut + weekly cadence ----- */
  const ce = d.contentEngine;
  if (ce && (list(ce.mix) || list(ce.week))) {
    add("content", "Plan", `
      ${sectionHead(++n, "The content engine", ce.title || "What goes out, and *when*", ce.sub)}
      <div class="content-wrap">
        ${list(ce.mix) ? `<div class="chart-card reveal"><h3>Recommended content mix</h3><p class="hint">${esc(ce.mixHint || "Share of weekly output by pillar.")}</p>
          <div class="donut-wrap">${donut(ce.mix, ce.center)}
            <div class="donut-legend">${ce.mix.map((m, i) => `<div><i style="background:${SERIES[i % SERIES.length]}"></i><span>${esc(m.name)}${m.detail ? `<small>${esc(m.detail)}</small>` : ""}</span><b>${esc(m.pct)}%</b></div>`).join("")}</div>
          </div></div>` : ""}
        ${list(ce.week) ? `<div class="chart-card reveal"><h3>A typical week</h3><p class="hint">${esc(ce.weekHint || "Who posts what, Monday to Friday.")}</p>
          <div class="week">${ce.week.map((day) => `<div class="day"><b>${esc(day.day)}</b>${(day.slots || []).map((s) => `<div class="slot">${esc(s.title)}${s.who ? `<small>${esc(s.who)}</small>` : ""}</div>`).join("")}</div>`).join("")}</div></div>` : ""}
      </div>`);
  }

  /* ----- What elevraa. will do ----- */
  if (list(d.services)) {
    add("services", "Plan", `
      ${sectionHead(++n, "What elevraa. will do", d.servicesTitle || `How we'd help *${brand.name}* win`, d.servicesSub)}
      <div class="grid ${d.services.length % 3 === 0 ? "g3" : "g2"}">
        ${d.services.map((s, i) => `<div class="card svc reveal${s.featured ? " featured" : ""}">
          <div class="idx">${String(i + 1).padStart(2, "0")}</div>
          <h3 style="margin-top:14px">${fmt(s.title)}</h3>
          ${s.detail ? `<p>${fmt(s.detail)}</p>` : ""}
          ${list(s.deliverables) ? `<ul>${s.deliverables.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul>` : ""}
        </div>`).join("")}
      </div>`);
  }

  /* ----- Roadmap: 12-week timeline + phase cards ----- */
  if (list(d.roadmap) || (d.timeline && list(d.timeline.rows))) {
    const tl = d.timeline;
    const lanes = tl && list(tl.lanes) ? tl.lanes : [];
    const gantt = tl && list(tl.rows) ? `
      <div class="gantt reveal"><div class="gantt-inner">
        <div class="g-head"><span></span><span class="m">Month 1</span><span class="m">Month 2</span><span class="m">Month 3</span></div>
        <div class="g-head"><span></span>${Array.from({ length: 12 }, (_, i) => `<span class="w">W${i + 1}</span>`).join("")}</div>
        ${tl.rows.map((r) => {
          const s = clamp(num(r.start, 1), 1, 12), e = clamp(num(r.end, s), s, 12);
          return `<div class="g-row"><span class="t">${esc(r.task)}${lanes[r.lane] ? `<small>${esc(lanes[r.lane])}</small>` : ""}</span>
            <span class="g-bar grow lane-${num(r.lane) % 5}" style="grid-column:${s + 1} / ${e + 2}"></span></div>`;
        }).join("")}
        ${lanes.length ? `<div class="legend">${lanes.map((l, i) => `<span><i class="lane-${i % 5}"></i>${esc(l)}</span>`).join("")}</div>` : ""}
      </div></div>` : "";
    add("roadmap", "Roadmap", `
      ${sectionHead(++n, "The roadmap", d.roadmapTitle || "Your first *90 days*", d.roadmapSub)}
      ${gantt}
      ${list(d.roadmap) ? `<div class="road">
        ${d.roadmap.map((p) => `<div class="phase reveal">
          <span class="when">${esc(p.phase)}</span>
          <h3>${fmt(p.title)}</h3>
          ${list(p.items) ? `<ul>${p.items.map((x) => `<li><span>${fmt(x)}</span></li>`).join("")}</ul>` : ""}
          ${p.outcome ? `<div class="out"><b>By the end</b>${fmt(p.outcome)}</div>` : ""}
        </div>`).join("")}
      </div>` : ""}`);
  }

  /* ----- Impact: projection chart + outcomes ----- */
  const pj = d.projection;
  if ((pj && list(pj.series)) || list(d.outcomes)) {
    add("impact", "Impact", `
      ${sectionHead(++n, "Projected impact", d.outcomesTitle || "What success looks like at *day 90*", d.outcomesSub)}
      ${pj && list(pj.series) ? `<div class="impact-wrap" style="margin-bottom:16px">
        <div class="chart-card reveal"><h3>${esc(pj.title || pj.metric)}</h3>${pj.hint ? `<p class="hint">${esc(pj.hint)}</p>` : ""}${lineChart(pj)}</div>
        <div class="impact-side">
          ${pj.headline ? `<div class="big-delta reveal"><b>${esc(pj.headline.value)}</b><span>${fmt(pj.headline.label)}</span></div>` : ""}
          ${pj.note ? `<div class="card reveal"><p style="margin:0">${fmt(pj.note)}</p></div>` : ""}
        </div>
      </div>` : ""}
      ${list(d.outcomes) ? `<div class="grid g4">${d.outcomes.map((o) => `<div class="card outcome reveal"><b>${esc(o.value)}</b><span>${fmt(o.label)}</span></div>`).join("")}</div>` : ""}`);
  }

  /* ----- What we need ----- */
  if (list(d.needs)) {
    add("needs", "Next steps", `
      ${sectionHead(++n, "What we need from you", "To start in *week one*", "Small asks that make everything above move faster.")}
      <div class="needs">${d.needs.map((x) => `<div class="need reveal"><span class="box"></span><span>${fmt(x)}</span></div>`).join("")}</div>`);
  }

  /* ----- Investment ----- */
  if (d.investment && list(d.investment.options)) {
    const inv = d.investment;
    add("investment", "Next steps", `
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
      ${inv.note ? `<p class="sub" style="font-size:14px">${fmt(inv.note)}</p>` : ""}`);
  }

  /* ----- Shell ----- */
  const cta = d.cta || {};
  const ctaLink = cta.link || "https://calendly.com/nisarg-elevraa/30min";
  const initials = esc((brand.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase());
  const groups = [...new Set(sections.map((s) => s.group))];
  const firstOf = (g) => sections.find((s) => s.group === g).id;
  const hs = d.hero?.score;
  const site = brand.website ? esc(brand.website.replace(/^https?:\/\//, "")) : "";

  document.title = `${brand.name || "Brand"} ${meta.title || "Growth Plan"} | elevraa.`;

  document.getElementById("app").innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        ${LOGO()}
        <nav aria-label="Sections">${groups.map((g) => `<a href="#${firstOf(g)}" data-group="${esc(g)}">${esc(g)}</a>`).join("")}</nav>
        <a class="btn" href="${esc(ctaLink)}" target="_blank" rel="noopener">${esc(cta.button || "Book a call")}</a>
      </div>
      <div class="progress"><i></i></div>
    </header>

    <main>
      <section class="hero">
        <div class="wrap hero-grid">
          <div>
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
              ${site ? `<span><a href="https://${site}" target="_blank" rel="noopener">${site}</a></span>` : ""}
            </div>
            <div class="hero-actions reveal">
              ${sections[0] ? `<a class="btn dark" href="#${sections[0].id}">Read the plan ↓</a>` : ""}
              <button class="btn ghost" onclick="window.print()">Save as PDF</button>
            </div>
          </div>
          ${hs ? `<div class="score-card reveal">
            <div class="top">${gauge(hs.value, 10, hs.benchmark)}
              <div><div class="cap">${esc(hs.label || "Brand presence score")}</div>
              <div class="big">${fmt(hs.headline || `${hs.value}/10${hs.benchmark !== undefined ? ` vs. ${hs.benchmark} for the category leader` : ""}`)}</div></div>
            </div>
            ${list(hs.compare) ? `<div class="vs">${hs.compare.map((c) => `<div class="vs-row"><span style="${c.me ? "font-weight:600;color:var(--ink)" : ""}">${esc(c.name)}</span><div class="bar"><i data-w="${clamp(num(c.value), 0, 10) * 10}%" style="${c.me ? "" : "background:var(--mist)"}"></i></div><b>${esc(c.value)}</b></div>`).join("")}</div>` : ""}
          </div>` : ""}
        </div>
      </section>

      ${sections.map((s) => s.html).join("")}

      <section class="block" id="next" data-group="Next steps">
        <div class="cta reveal">
          <span class="emark" aria-hidden="true">e</span>
          <h2 style="margin-top:22px">${fmt(cta.title || "Let's make you the *obvious choice*.")}</h2>
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
            <a href="mailto:${esc(cta.email || "nisarg@elevraa.com")}">${esc(cta.email || "nisarg@elevraa.com")}</a><br>
            <a href="https://elevraa.com" target="_blank" rel="noopener">elevraa.com</a>
          </div>
        </div>
        <div class="fine">${fmt(d.footnote || `Prepared exclusively for ${brand.name}. Figures and timelines are proposed starting points, open to revision once we align.`)}</div>
      </div>
    </footer>`;

  wire();
}

function settle(el) {
  el.classList.add("in");
  el.querySelectorAll(".bar > i[data-w]").forEach((b) => (b.style.width = b.dataset.w));
  el.querySelectorAll("[data-off]").forEach((c) => (c.style.strokeDashoffset = c.dataset.off));
}

function wire() {
  // Channel tabs
  const tabs = [...document.querySelectorAll(".tab")];
  tabs.forEach((t, i) =>
    t.addEventListener("click", () => {
      tabs.forEach((x, j) => {
        x.setAttribute("aria-selected", String(i === j));
        const p = document.getElementById(`panel-${j}`);
        p.classList.toggle("show", i === j);
        if (i === j) settle(p);
      });
    })
  );

  // Reveal on scroll: fades, bars, gauges and chart drawing
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { settle(e.target); io.unobserve(e.target); } }),
    { rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  const firstPanel = document.getElementById("panel-0");
  if (firstPanel) io.observe(firstPanel);

  // Active menu group + reading progress
  const links = [...document.querySelectorAll(".topbar nav a")];
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const g = e.target.dataset.group;
      links.forEach((a) => a.classList.toggle("active", a.dataset.group === g));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("section.block[id]").forEach((s) => spy.observe(s));
  const bar = document.querySelector(".progress i");
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${h > 0 ? (scrollY / h) * 100 : 0}%`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Printing shows everything in its final state
  addEventListener("beforeprint", () => document.querySelectorAll(".reveal, .panel").forEach(settle));
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
