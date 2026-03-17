"use strict";
const PDFDocument = require("pdfkit");

// ══════════════════════════════════════════════════════════════
// COLORS
// ══════════════════════════════════════════════════════════════
const C = {
  blue: "#2563eb",
  blueDark: "#1e3a8a",
  blueLight: "#eff6ff",
  blueMid: "#bfdbfe",
  green: "#16a34a",
  greenLight: "#dcfce7",
  amber: "#b45309",
  amberLight: "#fef3c7",
  orange: "#c2410c",
  orangeLight: "#ffedd5",
  red: "#dc2626",
  redLight: "#fee2e2",
  purple: "#7c3aed",
  teal: "#0d9488",
  slate900: "#0f172a",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  white: "#ffffff",
};

// ══════════════════════════════════════════════════════════════
// LAYOUT CONSTANTS
// ══════════════════════════════════════════════════════════════
const PW = 595.28;
const PH = 841.89;
const ML = 40;
const MR = 40;
const CW = PW - ML - MR;

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const inr = (n) => {
  if (!n && n !== 0) return "—";
  const num = +String(n).replace(/,/g, "");
  if (isNaN(num)) return "—";
  return "Rs " + num.toLocaleString("en-IN");
};

const fmtHorizon = (yrs, gKey) =>
  gKey === "emergency" ? `${Math.round(yrs * 12)} mo` : `${yrs} yrs`;

const stripBold = (t) =>
  String(t || "")
    .replace(/\*\*/g, "")
    .replace(/₹/g, "Rs ");

const affordStyle = (val) => ({
  "Comfortable": { bg: C.greenLight, fg: C.green },
  "Manageable Stretch": { bg: C.amberLight, fg: C.amber },
  "Tight but Possible": { bg: C.orangeLight, fg: C.orange },
  "Needs Adjustment": { bg: C.redLight, fg: C.red },
}[val] || { bg: C.slate100, fg: C.slate500 });

const healthStyle = (s) =>
  s >= 80 ? { bg: C.greenLight, fg: C.green } :
    s >= 60 ? { bg: C.blueLight, fg: C.blue } :
      s >= 40 ? { bg: C.amberLight, fg: C.amber } :
        { bg: C.redLight, fg: C.red };

const getRates = (rp) => {
  const key = (rp || "moderate").toLowerCase().replace(/ /g, "_");
  return ({
    very_conservative: { pre: 0.088, post: 0.079 },
    conservative: { pre: 0.096, post: 0.087 },
    moderate: { pre: 0.108, post: 0.097 },
    aggressive: { pre: 0.119, post: 0.108 },
    very_aggressive: { pre: 0.131, post: 0.118 },
  }[key] || { pre: 0.108, post: 0.097 });
};

// ══════════════════════════════════════════════════════════════
// PRIMITIVE DRAWERS
// ══════════════════════════════════════════════════════════════
const rect = (doc, x, y, w, h, fill, stroke, r = 0) => {
  if (r > 0) doc.roundedRect(x, y, w, h, r);
  else doc.rect(x, y, w, h);
  if (fill && stroke) doc.fillAndStroke(fill, stroke);
  else if (fill) doc.fill(fill);
  else if (stroke) doc.stroke(stroke);
};

const txt = (doc, str, x, y, {
  size = 10, color = C.slate900, bold = false,
  width, align = "left", lineBreak = false, lineGap = 2,
} = {}) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica")
    .fontSize(size).fillColor(color).lineGap(lineGap);
  const opts = { align, lineBreak: lineBreak || !!width };
  if (width) opts.width = width;
  doc.text(stripBold(String(str ?? "—")), x, y, opts);
};

const pill = (doc, label, x, y, { bg, fg, w, h = 15, size = 8 } = {}) => {
  const pw = w || doc.widthOfString(label, { fontSize: size }) + 18;
  rect(doc, x, y, pw, h, bg, undefined, h / 2);
  txt(doc, label, x, y + (h - size) / 2, { size, color: fg, bold: true, width: pw, align: "center" });
  return pw;
};

const sectionTitle = (doc, title, y) => {
  txt(doc, title.toUpperCase(), ML, y, { size: 7.5, bold: true, color: C.blue });
  doc.moveTo(ML + doc.widthOfString(title.toUpperCase(), { fontSize: 7.5 }) + 8, y + 5)
    .lineTo(PW - MR, y + 5)
    .strokeColor(C.blueMid).lineWidth(0.8).stroke();
  return y + 16;
};

const allocBar = (doc, x, y, w, eq, dbt, liq) => {
  const h = 10;
  const eW = Math.round(w * eq / 100);
  const dW = Math.round(w * dbt / 100);
  const lW = w - eW - dW;
  rect(doc, x, y, eW, h, C.blue, undefined, 0);
  rect(doc, x + eW, y, dW, h, C.purple, undefined, 0);
  rect(doc, x + eW + dW, y, lW, h, C.teal, undefined, 0);
};

const newPageIfNeeded = (doc, y, need, state) => {
  if (y + need > PH - 50) {
    doc.addPage();
    buildPageFooter(doc, state);
    return ML;
  }
  return y;
};

// ══════════════════════════════════════════════════════════════
// PAGE FOOTER
// ══════════════════════════════════════════════════════════════
function buildPageFooter(doc, state) {
  const y = PH - 28;
  rect(doc, 0, y, PW, 28, C.blueDark);
  txt(doc, "Amit Kumar  ·  MFD  ·  AMFI ARN-123456  ·  +91 98765 43210",
    ML, y + 8, { size: 8, color: C.white, bold: true });
  txt(doc, `Page ${state.page++}  ·  ${new Date().toLocaleDateString("en-IN")}`,
    PW - MR - 100, y + 8, { size: 8, color: "rgba(255,255,255,0.7)", width: 100, align: "right" });
}

// ══════════════════════════════════════════════════════════════
// SECTION 1 — COVER HEADER
// ══════════════════════════════════════════════════════════════
function buildHeader(doc, ctx) {
  const { pTitle, client, gKey, planData } = ctx;
  const ip = planData?.investment_plan;
  const sipAmt = ip?.applied_monthly_sip || 0;
  const sipYears = planData?.plan_summary?.horizon_years
    || planData?.profile?.accumulation_years || 0;

  rect(doc, 0, 0, PW, 100, C.blueDark);
  rect(doc, 0, 60, PW, 40, C.blue);

  doc.circle(PW - 30, 10, 60).fillOpacity(0.06).fill(C.white).fillOpacity(1);
  doc.circle(PW - 10, 80, 40).fillOpacity(0.06).fill(C.white).fillOpacity(1);

  txt(doc, pTitle || "Goal Plan", ML, 22, { size: 17, bold: true, color: C.white });

  const meta = [client, gKey?.replace(/_/g, " ")?.toUpperCase(), new Date().toLocaleDateString("en-IN")]
    .filter(Boolean).join("   ·   ");
  txt(doc, meta, ML, 46, { size: 9, color: "rgba(255,255,255,0.75)" });

  if (sipAmt > 0) {
    const bx = PW - MR - 130, by = 12;
    rect(doc, bx, by, 130, 56, C.blueDark, undefined, 10);
    rect(doc, bx, by, 130, 56, undefined, C.blueMid, 10);
    txt(doc, "MONTHLY SIP", bx, by + 8,
      { size: 7, color: "rgba(255,255,255,0.7)", width: 130, align: "center", bold: true });
    txt(doc, inr(sipAmt), bx, by + 20,
      { size: 16, color: C.white, bold: true, width: 130, align: "center" });
    txt(doc, `${fmtHorizon(sipYears, gKey)}  ·  ${ip?.return_percent ?? "—"}% p.a.`,
      bx, by + 40, { size: 8, color: "rgba(255,255,255,0.75)", width: 130, align: "center" });
  }

  return 112;
}

// ══════════════════════════════════════════════════════════════
// SECTION 2 — SIP SPOTLIGHT
// ══════════════════════════════════════════════════════════════
function buildSpotlight(doc, ctx, y) {
  const { planData, gKey } = ctx;
  const ip = planData?.investment_plan;
  const sipAmt = ip?.applied_monthly_sip || 0;
  const sipYears = planData?.plan_summary?.horizon_years
    || planData?.profile?.accumulation_years || 0;
  if (!sipAmt) return y;

  rect(doc, ML, y, CW, 56, C.blueLight, C.blueMid, 8);

  txt(doc, "Recommended Monthly SIP", ML + 14, y + 10, { size: 8, color: C.blue, bold: true });
  txt(doc, inr(sipAmt), ML + 14, y + 22, { size: 20, bold: true, color: C.blueDark });

  const pills = [ip?.mode, `${ip?.return_percent ?? "—"}% p.a.`, fmtHorizon(sipYears, gKey)].filter(Boolean);
  let px = ML + 14;
  pills.forEach(p => {
    const pw = doc.widthOfString(p, { fontSize: 8 }) + 14;
    rect(doc, px, y + 44, pw, 10, C.white, undefined, 5);
    txt(doc, p, px + 2, y + 46, { size: 7.5, color: C.blue });
    px += pw + 6;
  });

  if (ip?.affordability) {
    const as = affordStyle(ip.affordability);
    const aw = doc.widthOfString(ip.affordability, { fontSize: 8.5 }) + 20;
    rect(doc, PW - MR - aw - 14, y + 20, aw, 18, as.bg, undefined, 9);
    txt(doc, ip.affordability, PW - MR - aw - 14, y + 24,
      { size: 8.5, color: as.fg, bold: true, width: aw, align: "center" });
  }

  return y + 68;
}

// ══════════════════════════════════════════════════════════════
// SECTION 3 — NARRATIVE
// ══════════════════════════════════════════════════════════════
function buildNarrative(doc, ctx, y, state) {
  const text = ctx.planData?.plan_narrative;
  if (!text) return y;
  const clean = stripBold(text);

  const textH = doc.heightOfString(clean, { width: CW - 24, fontSize: 10, lineGap: 3 });
  y = newPageIfNeeded(doc, y, textH + 40, state);
  y = sectionTitle(doc, "Goal Narrative", y);

  rect(doc, ML, y, 3, textH + 20, C.blue);
  txt(doc, clean, ML + 12, y + 6,
    { size: 10, color: C.slate700, width: CW - 20, lineBreak: true, lineGap: 3 });

  return y + textH + 24;
}

// ══════════════════════════════════════════════════════════════
// SECTION 4 — KEY DETAILS (two-column)
// ══════════════════════════════════════════════════════════════
function buildKeyDetails(doc, ctx, y, state) {
  const { planData, gKey, summary } = ctx;
  const ip = planData?.investment_plan;
  const corpus = planData?.corpus;
  const health = planData?.health;
  const ri = planData?.retirement_income;
  const isRetirement = gKey === "retirement";

  const computed = [
    corpus?.target_corpus != null && {
      label: "Inflation Adj. Target", val: inr(corpus.target_corpus), type: "inr",
    },
    (corpus?.achievement_percent != null || corpus?.affordable_achievement_percent != null) && {
      label: "Goal Achievement",
      val: `${corpus.achievement_percent ?? corpus.affordable_achievement_percent}%`,
      type: "pct",
    },
    ip?.monthly_surplus && {
      label: "Monthly Surplus", val: inr(ip.monthly_surplus), type: "inr",
    },
    ip?.affordability && {
      label: "Affordability", val: ip.affordability, type: "pill",
      style: affordStyle(ip.affordability),
    },
    health?.score && {
      label: "Health Score", val: `${health.score}`, sub: health.rating,
      type: "score", style: healthStyle(health.score),
    },
    isRetirement && ri?.monthly_income_at_retirement && {
      label: "Income at Retirement", val: `${inr(ri.monthly_income_at_retirement)}/mo`, type: "inr",
    },
    isRetirement && ri?.sustainability && {
      label: "Sustainability", val: ri.sustainability, type: "pill",
      style: ri.sustainability === "Sustainable Through Retirement"
        ? { bg: C.greenLight, fg: C.green } : { bg: C.redLight, fg: C.red },
    },
    isRetirement && ri?.safe_withdrawal_rate_percent && {
      label: "Safe Withdrawal Rate", val: `${ri.safe_withdrawal_rate_percent}%`, type: "pct",
    },
  ].filter(Boolean);

  const ROW_H = 24;
  const HEAD_H = 26;
  const GAP = 6;
  const colW = (CW - GAP) / 2;
  const lx = ML;
  const rx = ML + colW + GAP;
  const LABEL_W = colW * 0.52;
  const totalRows = Math.max(summary.length, computed.length);

  y = newPageIfNeeded(doc, y, totalRows * ROW_H + HEAD_H + 20, state);
  y = sectionTitle(doc, "Key Details", y);

  // Column headers
  rect(doc, lx, y, colW, HEAD_H, C.slate700, undefined, 4);
  rect(doc, rx, y, colW, HEAD_H, C.blue, undefined, 4);
  rect(doc, lx + 10, y + HEAD_H / 2 - 3, 6, 6, "#94a3b8", undefined, 3);
  rect(doc, rx + 10, y + HEAD_H / 2 - 3, 6, 6, C.blueMid, undefined, 3);
  txt(doc, "INVESTOR ANSWERS", lx + 20, y + (HEAD_H - 8) / 2, { size: 7.5, bold: true, color: C.white });
  txt(doc, "PLAN ANALYSIS", rx + 20, y + (HEAD_H - 8) / 2, { size: 7.5, bold: true, color: C.white });

  const lbadge = `${summary.length} fields`;
  const rbadge = `${computed.length} fields`;
  const lbw = doc.widthOfString(lbadge, { fontSize: 7 }) + 12;
  const rbw = doc.widthOfString(rbadge, { fontSize: 7 }) + 12;
  rect(doc, lx + colW - lbw - 6, y + (HEAD_H - 14) / 2, lbw, 14, "rgba(255,255,255,0.18)", undefined, 7);
  rect(doc, rx + colW - rbw - 6, y + (HEAD_H - 14) / 2, rbw, 14, "rgba(255,255,255,0.18)", undefined, 7);
  txt(doc, lbadge, lx + colW - lbw - 6, y + (HEAD_H - 8) / 2, { size: 7, color: C.white, width: lbw, align: "center" });
  txt(doc, rbadge, rx + colW - rbw - 6, y + (HEAD_H - 8) / 2, { size: 7, color: C.white, width: rbw, align: "center" });
  y += HEAD_H;

  // Rows
  for (let i = 0; i < totalRows; i++) {
    const ry = y + i * ROW_H;
    const cy = ry + (ROW_H - 8.5) / 2;

    // Left col
    if (summary[i]) {
      const bg = i % 2 === 0 ? C.white : C.slate50;
      rect(doc, lx, ry, colW, ROW_H, bg, C.slate100, 0);
      rect(doc, lx, ry, 3, ROW_H, C.slate300, undefined, 0);
      doc.font("Helvetica").fontSize(8).fillColor(C.slate500);
      doc.text(summary[i].label, lx + 12, cy, { width: LABEL_W, lineBreak: false, ellipsis: true });
      const valStr = String(summary[i].val);
      const vw = doc.widthOfString(valStr, { fontSize: 8.5 });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.slate900);
      doc.text(valStr, Math.max(lx + LABEL_W + 12, lx + colW - vw - 10), cy, { lineBreak: false });
    } else {
      rect(doc, lx, ry, colW, ROW_H, C.slate50, C.slate100, 0);
    }

    // Right col
    if (computed[i]) {
      const row = computed[i];
      const rbg = i % 2 === 0 ? C.blueLight : "#dbeafe";
      rect(doc, rx, ry, colW, ROW_H, rbg, C.blueMid, 0);
      rect(doc, rx, ry, 3, ROW_H, C.blue, undefined, 0);
      doc.font("Helvetica").fontSize(8).fillColor(C.slate500);
      doc.text(row.label, rx + 12, cy, { width: LABEL_W, lineBreak: false, ellipsis: true });

      if (row.type === "pill") {
        const maxPW = colW - LABEL_W - 14;
        let fs = 7.5;
        let vw = doc.font("Helvetica-Bold").fontSize(fs).widthOfString(row.val);
        if (vw + 16 > maxPW) { fs = 6.5; vw = doc.font("Helvetica-Bold").fontSize(fs).widthOfString(row.val); }
        const pw = Math.min(vw + 14, maxPW);
        const ph = 14;
        const px = rx + colW - pw - 8;
        const py = ry + (ROW_H - ph) / 2;
        rect(doc, px, py, pw, ph, row.style.bg, undefined, ph / 2);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(row.style.fg);
        doc.text(row.val, px + 2, py + (ph - fs) / 2, { width: pw - 4, align: "center", lineBreak: false });

      } else if (row.type === "score") {
        const fs = 7;
        const rw = doc.widthOfString(row.sub, { fontSize: fs }) + 14;
        const rh = 14;
        const rpx = rx + colW - rw - 8;
        const rpy = ry + (ROW_H - rh) / 2;
        rect(doc, rpx, rpy, rw, rh, row.style.bg, undefined, rh / 2);
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(row.style.fg);
        doc.text(row.sub, rpx + 2, rpy + (rh - fs) / 2, { width: rw - 4, align: "center", lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(11).fillColor(row.style.fg);
        doc.text(row.val, rpx - 22, ry + (ROW_H - 11) / 2, { lineBreak: false });

      } else if (row.type === "pct") {
        const fs = 10;
        const vw = doc.widthOfString(row.val, { fontSize: fs });
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(C.blue);
        doc.text(row.val, rx + colW - vw - 10, ry + (ROW_H - fs) / 2, { lineBreak: false });

      } else {
        const fs = 8.5;
        const vw = doc.widthOfString(row.val, { fontSize: fs });
        doc.font("Helvetica-Bold").fontSize(fs).fillColor(C.blue);
        doc.text(row.val, rx + colW - vw - 10, cy, { lineBreak: false });
      }
    } else {
      rect(doc, rx, ry, colW, ROW_H, "#f0f7ff", C.blueLight, 0);
    }

    doc.moveTo(lx, ry + ROW_H).lineTo(lx + CW, ry + ROW_H)
      .strokeColor(C.slate100).lineWidth(0.3).stroke();
  }

  doc.moveTo(lx, y + totalRows * ROW_H).lineTo(lx + CW, y + totalRows * ROW_H)
    .strokeColor(C.slate300).lineWidth(0.8).stroke();

  return y + totalRows * ROW_H + 14;
}

// ══════════════════════════════════════════════════════════════
// SECTION 5 — ASSET ALLOCATION
// ══════════════════════════════════════════════════════════════
function buildAllocation(doc, ctx, y, state) {
  const { planData, gKey } = ctx;
  const alloc = planData?.allocation;
  const allocPre = planData?.allocation_pre_retirement;
  const allocPost = planData?.allocation_post_retirement;
  if (!alloc && !allocPre) return y;

  y = newPageIfNeeded(doc, y, 110, state);
  y = sectionTitle(doc, "Asset Allocation", y);

  const isRetirement = gKey === "retirement";
  const items = isRetirement
    ? [{ a: allocPre, label: "Pre-Retirement" }, { a: allocPost, label: "Post-Retirement" }]
    : [{ a: alloc, label: "Allocation" }];
  const cardW = isRetirement ? (CW - 10) / 2 : CW;

  items.forEach(({ a, label }, i) => {
    if (!a) return;
    const cx = ML + i * (cardW + 10);
    const cy = y;

    rect(doc, cx, cy, cardW, 88, C.slate50, C.slate300, 6);
    txt(doc, label.toUpperCase(), cx + 12, cy + 10, { size: 7, bold: true, color: C.slate500 });
    allocBar(doc, cx + 12, cy + 24, cardW - 24, a.equity_pct, a.debt_pct, a.liquid_pct);

    const legend = [
      { label: "Equity", pct: a.equity_pct, amt: a.equity_amt, color: C.blue },
      { label: "Debt", pct: a.debt_pct, amt: a.debt_amt, color: C.purple },
      { label: "Liquid", pct: a.liquid_pct, amt: a.liquid_amt, color: C.teal },
    ];

    legend.forEach((r, ri) => {
      const ry = cy + 42 + ri * 15;
      const rcy = ry + 1;

      rect(doc, cx + 12, rcy + 1, 9, 9, r.color, undefined, 2);
      doc.font("Helvetica").fontSize(9).fillColor(C.slate700);
      doc.text(r.label, cx + 26, rcy, { lineBreak: false });

      if (r.amt > 0) {
        const amtStr = inr(r.amt);
        const amtW = doc.font("Helvetica").fontSize(8.5).widthOfString(amtStr);
        doc.font("Helvetica").fontSize(8.5).fillColor(C.slate500);
        doc.text(amtStr, cx + cardW - amtW - 10, rcy + 0.5, { lineBreak: false });
      }

      const pctStr = `${r.pct}%`;
      const pctW = doc.font("Helvetica-Bold").fontSize(9.5).widthOfString(pctStr);
      const amtGap = r.amt > 0
        ? doc.font("Helvetica").fontSize(8.5).widthOfString(inr(r.amt)) + 16
        : 10;
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.slate900);
      doc.text(pctStr, cx + cardW - pctW - amtGap, rcy, { lineBreak: false });
    });
  });

  return y + 100;
}

// ══════════════════════════════════════════════════════════════
// SECTION 6 — FINANCIAL HEALTH
// ══════════════════════════════════════════════════════════════
function buildHealth(doc, ctx, y, state) {
  const { planData } = ctx;
  const health = planData?.health;
  const ip = planData?.investment_plan;
  if (!health?.score) return y;

  y = newPageIfNeeded(doc, y, 90, state);
  y = sectionTitle(doc, "Financial Health", y);

  const hs = healthStyle(health.score);
  rect(doc, ML, y, CW, 76, C.slate50, C.slate200, 8);

  doc.font("Helvetica-Bold").fontSize(36).fillColor(hs.fg);
  doc.text(String(health.score), ML + 16, y + 12, { lineBreak: false });

  pill(doc, health.rating, ML + 68, y + 20, { bg: hs.bg, fg: hs.fg });

  const bx = ML + 68, bw = CW - 80, bh = 8;
  rect(doc, bx, y + 42, bw, bh, C.slate200, undefined, 4);
  rect(doc, bx, y + 42, Math.max(8, bw * health.score / 100), bh, hs.fg, undefined, 4);
  txt(doc, `${health.score}/100`, bx + bw - 28, y + 42, { size: 7.5, color: hs.fg, bold: true });

  const chips = [
    {
      label: "Emergency Fund",
      val: health.emergency_fund_months >= 6
        ? `${health.emergency_fund_months} mo OK`
        : health.emergency_fund_months > 0
          ? `${health.emergency_fund_months} mo`
          : "Not Set",
      warn: health.emergency_fund_months < 6,
    },
    ip?.monthly_surplus > 0 && { label: "Monthly Surplus", val: inr(ip.monthly_surplus), warn: false },
    ip?.affordability && { label: "Affordability", val: ip.affordability, warn: false },
  ].filter(Boolean);

  const chipW = (CW - (chips.length - 1) * 6) / chips.length;
  const chipY = y + 58;

  chips.forEach((ch, i) => {
    const cx = ML + i * (chipW + 6);
    rect(doc, cx, chipY, chipW, 18, ch.warn ? C.amberLight : C.white, C.slate200, 4);
    doc.font("Helvetica").fontSize(7).fillColor(C.slate500);
    doc.text(ch.label, cx + 8, chipY + 3, { lineBreak: false });
    const vStr = String(ch.val);
    const vw = doc.font("Helvetica-Bold").fontSize(8).widthOfString(vStr);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(ch.warn ? C.amber : C.slate900);
    doc.text(vStr, cx + chipW - vw - 8, chipY + 5, { lineBreak: false });
  });

  return y + 88;
}

// ══════════════════════════════════════════════════════════════
// SECTION 7 — RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════
function buildRecommendations(doc, ctx, y, state) {
  const recs = ctx.planData?.top_3_recommendations;
  if (!recs?.length) return y;

  y = newPageIfNeeded(doc, y, 60, state);
  y = sectionTitle(doc, "Recommendations", y);

  recs.forEach((rec, i) => {
    const clean = stripBold(rec);
    const textH = doc.heightOfString(clean, { width: CW - 52, fontSize: 9.5, lineGap: 3 });
    const cardH = Math.max(36, textH + 20);

    y = newPageIfNeeded(doc, y, cardH + 8, state);
    rect(doc, ML, y, CW, cardH, C.white, C.slate200, 6);
    rect(doc, ML, y, 4, cardH, C.blue, undefined, 2);

    rect(doc, ML + 12, y + cardH / 2 - 11, 22, 22, C.blue, undefined, 11);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(C.white);
    doc.text(String(i + 1), ML + 12, y + cardH / 2 - 6, { width: 22, align: "center", lineBreak: false });

    doc.font("Helvetica").fontSize(9.5).fillColor(C.slate700).lineGap(3);
    doc.text(clean, ML + 42, y + 10, { width: CW - 52, lineBreak: true });

    y += cardH + 6;
  });

  return y + 4;
}

// ══════════════════════════════════════════════════════════════
// SECTION 8 — RETIREMENT INCOME
// ══════════════════════════════════════════════════════════════
function buildRetirementIncome(doc, ctx, y, state) {
  const ri = ctx.planData?.retirement_income;
  if (!ri?.monthly_income_at_retirement) return y;

  y = newPageIfNeeded(doc, y, 80, state);
  y = sectionTitle(doc, "Retirement Income", y);

  const items = [
    { label: "Monthly Income at Retirement", val: `${inr(ri.monthly_income_at_retirement)}/mo`, highlight: true },
    { label: "Annual Withdrawal", val: inr(ri.annual_withdrawal), highlight: false },
    { label: "Safe Withdrawal Rate", val: `${ri.safe_withdrawal_rate_percent}%`, highlight: false },
    { label: "Sustainability", val: ri.sustainability, highlight: true },
  ];

  const colW = (CW - 8) / 2;
  items.forEach((item, i) => {
    const cx = ML + (i % 2) * (colW + 8);
    const cy = y + Math.floor(i / 2) * 30;
    rect(doc, cx, cy, colW, 26,
      item.highlight ? C.blueLight : C.slate50,
      item.highlight ? C.blueMid : C.slate200, 5);
    txt(doc, item.label, cx + 10, cy + 5, { size: 7.5, color: C.slate500 });
    txt(doc, item.val, cx + 10, cy + 14, { size: 9.5, bold: true, color: item.highlight ? C.blue : C.slate900 });
  });

  return y + 68;
}

// ══════════════════════════════════════════════════════════════
// SECTION 9 — PROJECTION TABLE
// ══════════════════════════════════════════════════════════════
function buildProjectionTable(doc, ctx, y, state) {
  const { planData, gKey } = ctx;
  const ip = planData?.investment_plan;
  const profile = planData?.profile;
  const plan_summary = planData?.plan_summary;
  const ri = planData?.retirement_income;
  const isRetirement = gKey === "retirement";

  const sipAmt = ip?.applied_monthly_sip || 0;
  const sipYears = plan_summary?.horizon_years || profile?.accumulation_years || 0;
  if (!sipAmt || !sipYears) return y;

  const rp = profile?.risk_profile || plan_summary?.risk_profile || "moderate";
  const rates = getRates(rp);
  const pre_r = rates.pre;
  const post_r = rates.post;
  const r_monthly = pre_r / 12;
  const currentAge = profile?.current_age || 30;
  const lumpsum = ip?.lumpsum_amount || 0;
  const projected = planData?.corpus?.projected_corpus || 0;
  const target = planData?.corpus?.target_corpus
    || planData?.corpus?.projected_corpus
    || 1;

  // Back-calculate savings FV contribution
  const full_n = sipYears * 12;
  const full_sip_fv = sipAmt * (Math.pow(1 + r_monthly, full_n) - 1) / r_monthly;
  const full_ls_fv = lumpsum * Math.pow(1 + pre_r, sipYears);
  const full_sav_fv = Math.max(0, projected - full_sip_fv - full_ls_fv);

  // ── Accumulation rows ──────────────────────────────────────
  const ACCUM_MS = [...new Set([1, 2, 3, 5, 7, 10, 15, 20, 25, 30].filter(n => n <= sipYears))];
  if (!ACCUM_MS.includes(sipYears)) ACCUM_MS.push(sipYears);
  ACCUM_MS.sort((a, b) => a - b);

  const accumRows = ACCUM_MS.map(ms => {
    const n = ms * 12;
    const sip_fv = sipAmt * (Math.pow(1 + r_monthly, n) - 1) / r_monthly;
    const ls_fv = lumpsum * Math.pow(1 + pre_r, ms);
    const sav_fv = full_sav_fv > 0
      ? full_sav_fv * Math.pow(1 + pre_r, ms) / Math.pow(1 + pre_r, sipYears)
      : 0;
    return {
      year: ms,
      age: currentAge + ms,
      totalInvested: Math.round(sipAmt * n + lumpsum),
      corpus: Math.round(sip_fv + ls_fv + sav_fv),
    };
  });
  
const actualCorpus = planData?.corpus?.projected_corpus;
if (actualCorpus && accumRows.length > 0) {
    accumRows[accumRows.length - 1].corpus = Math.round(actualCorpus);
}

  // ── Drawdown rows ──────────────────────────────────────────
  const drawRows = [];
  if (isRetirement && ri?.annual_withdrawal) {
    const retAge = profile?.retirement_age || currentAge + sipYears;
    const retYears = profile?.retirement_years || 25;
    const DRAW_MS = [...new Set([1, 3, 5, 10, 15, 20, 25].filter(n => n <= retYears))];
    if (!DRAW_MS.includes(retYears)) DRAW_MS.push(retYears);
    DRAW_MS.sort((a, b) => a - b);

    let c = projected;
    let w = ri.annual_withdrawal;
    for (let yr = 1; yr <= retYears; yr++) {
      c = c * (1 + post_r) - w;
      w = w * 1.06;
      if (DRAW_MS.includes(yr)) {
        drawRows.push({
          year: yr,
          age: retAge + yr,
          withdrawal: Math.round(w / 1.06),
          corpus: Math.round(c),
        });
      }
    }
  }

  const ROW_H = 20;
  const HEAD_H = 26;
  const FOOT_H = 22;

  // ── Generic table renderer ─────────────────────────────────
  const drawTable = (cols, rows, headerBg, renderRow, startY) => {
    const TW = CW;
    const TX = ML;

    let widths = cols.map(c => Math.floor(TW * c.pct / 100));
    widths[widths.length - 1] += TW - widths.reduce((s, w) => s + w, 0);

    rect(doc, TX, startY, TW, HEAD_H, headerBg, undefined, 4);
    let hx = TX;
    cols.forEach((col, i) => {
      const w = widths[i];
      if (i > 0) {
        doc.moveTo(hx, startY + 5).lineTo(hx, startY + HEAD_H - 5)
          .strokeColor("rgba(255,255,255,0.18)").lineWidth(0.5).stroke();
      }
      txt(doc, col.label, hx + 6, startY + (HEAD_H - 8) / 2,
        { size: 7.5, bold: true, color: C.white, width: w - 12, align: col.align });
      hx += w;
    });

    let cy = startY + HEAD_H;
    rows.forEach((row, ri) => {
      cy = newPageIfNeeded(doc, cy, ROW_H + 2, state);
      renderRow(doc, TX, cy, widths, row, ri, rows.length);
      cy += ROW_H;
    });

    doc.moveTo(TX, cy).lineTo(TX + TW, cy)
      .strokeColor(C.slate300).lineWidth(0.8).stroke();

    return cy + FOOT_H;
  };

  // ── Accumulation table ─────────────────────────────────────
  y = newPageIfNeeded(doc, y, accumRows.length * ROW_H + HEAD_H + FOOT_H + 30, state);
  y = sectionTitle(doc, "Corpus Projection — Year by Year", y);

  const aCols = [
    { label: "YEAR", pct: 8, align: "center" },
    { label: "AGE", pct: 8, align: "center" },
    { label: "TOTAL INVESTED", pct: 22, align: "right" },
    { label: "CORPUS VALUE", pct: 28, align: "right" },
    { label: "RETURNS EARNED", pct: 22, align: "right" },
    { label: "% OF GOAL", pct: 12, align: "center" },
  ];

  const renderAccumRow = (doc, TX, cy, widths, row, i, total) => {
    const pct = Math.min(100, Math.round(row.corpus / target * 100));
    const returns = Math.max(0, row.corpus - row.totalInvested);
    const isLast = i === total - 1;
    const gc = pct >= 100 ? C.green : pct >= 75 ? C.blue : pct >= 50 ? C.amber : C.slate500;

    rect(doc, TX, cy, CW, ROW_H,
      isLast ? C.blueLight : i % 2 === 0 ? C.white : C.slate50,
      isLast ? C.blueMid : C.slate100, 0);

    rect(doc, TX, cy, 3, ROW_H,
      isLast ? C.blue : i < 3 ? C.slate300 : "transparent", undefined, 0);

    // Vertical dividers
    let dx = TX;
    widths.forEach((w, wi) => {
      if (wi > 0) {
        doc.moveTo(dx, cy + 3).lineTo(dx, cy + ROW_H - 3)
          .strokeColor(C.slate100).lineWidth(0.3).stroke();
      }
      dx += w;
    });

    const TY = cy + (ROW_H - 9) / 2;
    const cells = [
      { val: `Yr ${row.year}`, color: C.slate600, bold: false, size: 8.5 },
      { val: String(row.age), color: C.slate500, bold: false, size: 8.5 },
      { val: inr(row.totalInvested), color: C.slate600, bold: false, size: 8.5 },
      { val: inr(row.corpus), color: isLast ? C.blue : C.slate900, bold: true, size: 9 },
      { val: `+${inr(returns)}`, color: C.green, bold: false, size: 8.5 },
      { val: `${pct}%`, color: gc, bold: true, size: 9 },
    ];

    let cx = TX;
    cells.forEach((cell, ci) => {
      txt(doc, cell.val, cx + 6, TY,
        { size: cell.size, bold: cell.bold, color: cell.color, width: widths[ci] - 12, align: aCols[ci].align });
      cx += widths[ci];
    });
  };

  y = drawTable(aCols, accumRows, C.blue, renderAccumRow, y);

  // Summary footer
  const lastA = accumRows[accumRows.length - 1];
  if (lastA) {
    const totInv = lastA.totalInvested;
    const totRet = lastA.corpus - totInv;
    const retPct = Math.round(totRet / totInv * 100);
    rect(doc, ML, y - FOOT_H, CW, FOOT_H - 2, C.slate50, C.slate200, 0);
    txt(doc,
      `Total Invested: ${inr(totInv)}   •   Total Returns: ${inr(totRet)} (${retPct}% gain)   •   Final Corpus: ${inr(lastA.corpus)}`,
      ML, y - FOOT_H + 7, { size: 8, color: C.slate500, width: CW, align: "center" });
  }

  y += 14;

  // ── Drawdown table (retirement only) ──────────────────────
  if (drawRows.length > 0) {
    y = newPageIfNeeded(doc, y, drawRows.length * ROW_H + HEAD_H + FOOT_H + 30, state);
    y = sectionTitle(doc, "Retirement Drawdown — Corpus Sustainability", y);

    const dCols = [
      { label: "YEAR", pct: 8, align: "center" },
      { label: "AGE", pct: 8, align: "center" },
      { label: "ANNUAL WITHDRAWAL", pct: 26, align: "right" },
      { label: "CORPUS REMAINING", pct: 30, align: "right" },
      { label: "% REMAINING", pct: 14, align: "center" },
      { label: "STATUS", pct: 14, align: "center" },
    ];

    const startCorpus = projected || 1;

    const renderDrawRow = (doc, TX, cy, widths, row, i) => {
      const pct = Math.max(0, Math.round(row.corpus / startCorpus * 100));
      const depleted = row.corpus <= 0;
      const sc = pct > 80 ? C.green : pct > 60 ? C.blue : pct > 40 ? C.amber : pct > 20 ? C.orange : C.red;
      const sl = pct > 80 ? "Strong" : pct > 60 ? "Good" : pct > 40 ? "Fair" : pct > 20 ? "Caution" : depleted ? "Depleted" : "Critical";

      rect(doc, TX, cy, CW, ROW_H,
        depleted ? C.redLight : i % 2 === 0 ? C.white : C.slate50,
        depleted ? "#fca5a5" : C.slate100, 0);

      let dx = TX;
      widths.forEach((w, wi) => {
        if (wi > 0) {
          doc.moveTo(dx, cy + 3).lineTo(dx, cy + ROW_H - 3)
            .strokeColor(C.slate100).lineWidth(0.3).stroke();
        }
        dx += w;
      });

      const TY = cy + (ROW_H - 9) / 2;
      const cells = [
        { val: `Yr ${row.year}`, color: C.slate600, bold: false, size: 8.5 },
        { val: String(row.age), color: C.slate500, bold: false, size: 8.5 },
        { val: inr(row.withdrawal), color: C.slate700, bold: false, size: 8.5 },
        { val: depleted ? "Depleted" : inr(row.corpus), color: depleted ? C.red : C.slate900, bold: true, size: 9 },
        { val: depleted ? "0%" : `${pct}%`, color: sc, bold: true, size: 9 },
        { val: sl, color: sc, bold: true, size: 8.5 },
      ];

      let cx = TX;
      cells.forEach((cell, ci) => {
        txt(doc, cell.val, cx + 6, TY,
          { size: cell.size, bold: cell.bold, color: cell.color, width: widths[ci] - 12, align: dCols[ci].align });
        cx += widths[ci];
      });

      // Progress bar under corpus column
      // if (!depleted) {
      //   const barX = TX + widths.slice(0, 3).reduce((s, w) => s + w, 0) + 6;
      //   const barW = widths[3] - 12;
      //   rect(doc, barX, cy + ROW_H - 4, barW, 2.5, C.slate200, undefined, 1);
      //   rect(doc, barX, cy + ROW_H - 4, Math.max(3, barW * pct / 100), 2.5, sc, undefined, 1);
      // }
    };

    y = drawTable(dCols, drawRows, C.blueDark, renderDrawRow, y);

    const lastD = drawRows[drawRows.length - 1];
    if (lastD) {
      rect(doc, ML, y - FOOT_H, CW, FOOT_H - 2, C.slate50, C.slate200, 0);
      const note = lastD.corpus > 0
        ? `Corpus remains at ${inr(lastD.corpus)} at age ${lastD.age} — plan is sustainable through retirement.`
        : `Corpus fully utilised by age ${lastD.age} — as planned.`;
      txt(doc, note, ML, y - FOOT_H + 7, { size: 8, color: C.slate500, width: CW, align: "center" });
    }
  }

  return y + 10;
}

// ══════════════════════════════════════════════════════════════
// KEY LABELS MAP
// ══════════════════════════════════════════════════════════════
const KEY_LABELS = {
  currentAge: "Current Age",
  retirementAge: "Retirement Age",
  lifeExpectancy: "Life Expectancy",
  targetMonthlyIncome: "Target Monthly Income",
  monthlyIncome: "Monthly Income",
  monthlyExpenses: "Monthly Expenses",
  currentSavings: "Current Savings",
  emergencyFund: "Emergency Fund",
  timeHorizon: "Time Horizon",
  riskAppetite: "Risk Appetite",
  targetAmount: "Target Amount",
  propertyValue: "Property Value",
  downPayment: "Down Payment",
  hasLoan: "Has Loan",
  loanEmi: "Loan EMI",
  loanOutstanding: "Loan Outstanding",
  targetMonths: "Target Months",
  existingCoverage: "Existing Coverage",
};

// ══════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ══════════════════════════════════════════════════════════════
async function generatePlanPdf({ planData, pTitle, client, gKey, ans }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4", margin: 0,
      info: { Title: pTitle || "Goal Plan", Author: "Amit Kumar · MFD" },
    });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const state = { page: 1 };

    // Build summary from answers
    const summary = Object.entries(ans || {})
      .filter(([k, v]) => {
        if (!v || v === "" || v === "0") return false;
        if (["loanEmi", "loanOutstanding"].includes(k) && ans.hasLoan !== "yes") return false;
        return true;
      })
      .map(([k, v]) => ({
        label: KEY_LABELS[k] || k.replace(/([A-Z])/g, " $1").trim().replace(/^./, s => s.toUpperCase()),
        val: String(v),
      }))
      .slice(0, 12);

    const ctx = { planData, pTitle, client, gKey, ans, summary };

    // Build all sections
    let y = buildHeader(doc, ctx);
    buildPageFooter(doc, state);

    y += 10; y = buildSpotlight(doc, ctx, y);
    y += 12; y = buildNarrative(doc, ctx, y, state);
    y += 12; y = buildKeyDetails(doc, ctx, y, state);
    y += 12; y = buildAllocation(doc, ctx, y, state);
    y += 12; y = buildHealth(doc, ctx, y, state);
    y += 12; y = buildRecommendations(doc, ctx, y, state);

    if (gKey === "retirement") {
      y += 12;
      y = buildRetirementIncome(doc, ctx, y, state);
    }

    y += 12;
    buildProjectionTable(doc, ctx, y, state);

    doc.end();
  });
}

module.exports = { generatePlanPdf };