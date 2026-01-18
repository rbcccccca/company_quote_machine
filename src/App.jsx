import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";

const COMPANY = {
  name: "ARCHIMART PTY LTD",
  abn: "65 675 558 353",
  phone: "0432 336 299",
};

const PRICING = [
  {
    id: "ALU_PC",
    label: "Aluminium frame + 3mm Polycarbonate (PC) sheet",
    unit: 280,
    hint: "$280 / m²",
    type: "pc_roof",
  },
  {
    id: "TIMBER_HOLLOW",
    label: "Timber joists + Hollow WPC decking",
    unit: 260,
    hint: "$260 / m²",
    type: "deck_hollow",
  },
  {
    id: "TIMBER_SOLID",
    label: "Timber joists + Solid WPC decking",
    unit: 290,
    hint: "$290 / m²",
    type: "deck_solid",
  },
  {
    id: "ALU_HOLLOW",
    label: "Aluminium joists + Hollow WPC decking",
    unit: 330,
    hint: "$330 / m²",
    type: "deck_hollow",
  },
  {
    id: "ALU_SOLID",
    label: "Aluminium joists + Solid WPC decking",
    unit: 360,
    hint: "$360 / m²",
    type: "deck_solid",
  },
];

const PC_COLORS = [
  { id: "Clear", dot: "#f3f6ff" },
  { id: "Light Grey", dot: "#cfd5dd" },
  { id: "Brown Grey", dot: "#9a8c7a" },
  { id: "Dark Grey", dot: "#4a4f58" },
];

const DECK_SOLID_COLORS = [
  { id: "Redwood", dot: "#7b3a2e" },
  { id: "Coffee", dot: "#4b2f24" },
  { id: "Teak", dot: "#a06b3a" },
  { id: "Antique Grey", dot: "#6c6c6c" },
];

const DECK_HOLLOW_COLORS = [
  { id: "Redwood", dot: "#7b3a2e" },
  { id: "Teak", dot: "#a06b3a" },
];

const AWNING_SHAPES = [
  { id: "Straight", dot: "#aab3c5" },
  { id: "Curved", dot: "#8fd3ff" },
];

// --- Add-ons (UI shows CN/EN, PDF writes EN only)
const AWNING_ADDONS = [
  {
    id: "rear_beam_raise",
    labelZh: "后框升高",
    labelEn: "Rear beam raise",
    unit: 100,
    unitLabel: "$100 / m",
    explain: "Heighten rear beam (per metre).",
    qtyType: "number", // metres
  },
  {
    id: "post_concrete",
    labelZh: "立柱挖坑下埋混凝土",
    labelEn: "Post footing concrete",
    unit: 80,
    unitLabel: "$80 / post",
    explain: "Dig hole + bury post with concrete (per post).",
    qtyType: "int",
  },
  {
    id: "downpipe_cutout",
    labelZh: "落水管穿顶切口+防水",
    labelEn: "Downpipe cut-out & waterproofing",
    unit: 100,
    unitLabel: "$100 / job",
    explain: "Cut-out through roof sheet + waterproofing (per job).",
    qtyType: "int",
  },
  {
    id: "corner_structure",
    labelZh: "转角结构",
    labelEn: "Corner structure",
    unit: 200,
    unitLabel: "$200 / job",
    explain: "Corner structural detail (per job).",
    qtyType: "int",
  },
  {
    id: "triangle_cladding",
    labelZh: "边骨与屋檐三角区侧封",
    labelEn: "Triangle area cladding",
    unit: 150,
    unitLabel: "$150 / job",
    explain: "Cladding for triangle area between edge beam and eave (per job).",
    qtyType: "int",
  },
  {
    id: "gutter_outboard",
    labelZh: "水槽外飘结构（加顶梁）",
    labelEn: "Outboard gutter beam (extra top beam)",
    unit: 200,
    unitLabel: "$200 / job",
    explain: "Gutter outboard structure requires extra top beam (per job).",
    qtyType: "int",
  },
  {
    id: "high_work",
    labelZh: "高空作业（>3.3m）",
    labelEn: "High elevation work (>3.3m)",
    unit: 300,
    unitLabel: "$300 / job",
    explain: "Installation height above 3.3m (per job).",
    qtyType: "int",
  },
];

const DECKING_ADDONS = [
  {
    id: "stairs_steps",
    labelZh: "楼梯/台阶（按级）",
    labelEn: "Stairs / steps (per step)",
    unit: 300,
    unitLabel: "$300 / step",
    explain: "Enter number of steps.",
    qtyType: "int",
  },
  {
    id: "extra_side_cladding",
    labelZh: "侧封超出14cm部分（按面积）",
    labelEn: "Extra side cladding beyond 14cm (by area)",
    unit: 120,
    unitLabel: "$120 / m²",
    explain: "Only the area beyond 14cm (1 board height) is charged.",
    qtyType: "number", // m²
  },
];

function clamp2(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}
function clampInt(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function fmtMoney(n) {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtMoneyInt(n) {
  if (!Number.isFinite(n)) return "—";
  return `$${Math.trunc(n).toLocaleString()}`;
}
function fmtNum2(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Chip({ on, children, onClick, prefix, disabled }) {
  return (
    <div
      className={`chip ${on ? "on" : ""}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={0}
      style={disabled ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
      title={disabled ? "Please select a configuration first." : undefined}
    >
      {prefix}
      <div>{children}</div>
    </div>
  );
}

function ColorDot({ hex }) {
  return <span className="colorDot" style={{ background: hex }} />;
}

function genQuoteNo() {
  const d = new Date();
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `ACHM-Q-${y}${m}${day}-${rand}`;
}

export default function App() {
  const [quoteNo] = useState(genQuoteNo());

  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");

  // default 0.00 + placeholder 0.00
  const [length, setLength] = useState("0.00");
  const [width, setWidth] = useState("0.00");

  // configuration: start unselected
  const [productId, setProductId] = useState("");

  // optionals (only valid for certain configuration)
  const [pcColor, setPcColor] = useState("");
  const [deckColor, setDeckColor] = useState("");
  const [awningShape, setAwningShape] = useState("");

  // Add-ons state: quantities keyed by id (string -> string)
  const [addonQty, setAddonQty] = useState(() => ({}));
  // Custom add-ons (manual): fixed 3 rows
  const [customAddons, setCustomAddons] = useState([
    { name: "", amount: "" },
    { name: "", amount: "" },
    { name: "", amount: "" },
  ]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return PRICING.find((p) => p.id === productId) || null;
  }, [productId]);

  const isPcRoof = selectedProduct?.type === "pc_roof";
  const isDecking =
    selectedProduct?.type === "deck_solid" || selectedProduct?.type === "deck_hollow";

  const L = useMemo(() => clamp2(parseFloat(length)), [length]);
  const W = useMemo(() => clamp2(parseFloat(width)), [width]);
  const area = useMemo(() => clamp2(L * W), [L, W]);

  const unitRate = selectedProduct ? selectedProduct.unit : 0;
  const baseSubtotal = useMemo(() => area * unitRate, [area, unitRate]);

  // --- Add-on subtotal calculations
  const relevantAddons = useMemo(() => {
    const list = [];
    if (isPcRoof) list.push(...AWNING_ADDONS);
    if (isDecking) list.push(...DECKING_ADDONS);
    return list;
  }, [isPcRoof, isDecking]);

  const addonLines = useMemo(() => {
    // Only include add-ons that have qty > 0
    const lines = [];
    for (const a of relevantAddons) {
      const raw = addonQty[a.id];
      const qtyNum = parseFloat(raw);
      const qty =
        a.qtyType === "int" ? clampInt(qtyNum) : clamp2(Number.isFinite(qtyNum) ? qtyNum : 0);
      if (qty > 0) {
        lines.push({
          id: a.id,
          labelEn: a.labelEn,
          qty,
          unit: a.unit,
          unitLabel: a.unitLabel,
          subtotal: qty * a.unit,
        });
      }
    }
    return lines;
  }, [relevantAddons, addonQty]);

  const addonsSubtotal = useMemo(
    () => addonLines.reduce((s, x) => s + x.subtotal, 0),
    [addonLines]
  );

  const customSubtotal = useMemo(() => {
    let sum = 0;
    for (const row of customAddons) {
      const amt = parseFloat(row.amount);
      if (row.name.trim() && Number.isFinite(amt) && amt > 0) sum += amt;
    }
    return sum;
  }, [customAddons]);

  const total = useMemo(
    () => baseSubtotal + addonsSubtotal + customSubtotal,
    [baseSubtotal, addonsSubtotal, customSubtotal]
  );

  // Deal price: apply rounding ONLY when area >= 1 m²
  const roundingApplied = useMemo(() => area >= 1, [area]);
  const dealPrice = useMemo(() => {
    if (!Number.isFinite(total)) return 0;
    if (!roundingApplied) return clamp2(total);
    return Math.floor(total / 100) * 100;
  }, [total, roundingApplied]);

  const deposit = useMemo(() => {
    const d = dealPrice * 0.5;
    return roundingApplied ? Math.floor(d) : clamp2(d);
  }, [dealPrice, roundingApplied]);

  const balance = useMemo(() => clamp2(dealPrice - deposit), [dealPrice, deposit]);

  // Deposit paid flag (shown on UI and written to PDF)
  const [depositPaid, setDepositPaid] = useState(false);

  // Options section mapping (only when config selected)
  const colorOptions = useMemo(() => {
    if (!selectedProduct) return null;
    if (selectedProduct.type === "pc_roof")
      return { list: PC_COLORS, value: pcColor, set: setPcColor, title: "PC sheet colour (optional)" };
    if (selectedProduct.type === "deck_solid")
      return {
        list: DECK_SOLID_COLORS,
        value: deckColor,
        set: setDeckColor,
        title: "Decking colour (optional)",
      };
    if (selectedProduct.type === "deck_hollow")
      return {
        list: DECK_HOLLOW_COLORS,
        value: deckColor,
        set: setDeckColor,
        title: "Decking colour (optional)",
      };
    return null;
  }, [selectedProduct, pcColor, deckColor]);

  // Build configuration line (for PDF)
  const configLine = useMemo(() => {
    if (!selectedProduct) return "";
    const parts = [selectedProduct.label];

    if (isPcRoof) {
      if (awningShape) parts.push(`Awning shape: ${awningShape}`);
      if (pcColor) parts.push(`PC colour: ${pcColor}`);
    }
    if (isDecking) {
      if (deckColor) parts.push(`Decking colour: ${deckColor}`);
    }

    return parts.join(" | ");
  }, [selectedProduct, isPcRoof, isDecking, awningShape, pcColor, deckColor]);

  function onSelectProduct(nextId) {
    setProductId(nextId);
    // Reset unrelated optionals/addons when switching
    setPcColor("");
    setDeckColor("");
    setAwningShape("");

    // Clear add-on quantities
    setAddonQty({});
    // Keep custom add-ons (manual) as-is
  }

  function setQty(id, v) {
    setAddonQty((prev) => ({ ...prev, [id]: v }));
  }

  function downloadPDF() {
    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    const left = 14;
    let y = 16;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("QUOTE", left, y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Quote No: ${quoteNo}`, 196, y, { align: "right" });

    y += 5;
    doc.text(`Date: ${dateStr}`, 196, y, { align: "right" });

    y += 5;
    doc.setDrawColor(36, 40, 58);
    doc.line(left, y, 196, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(COMPANY.name, left, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`ABN: ${COMPANY.abn}`, left, y);
    y += 5;
    doc.text(`Phone: ${COMPANY.phone}`, left, y);

    y += 8;
    doc.setDrawColor(220);
    doc.line(left, y, 196, y);

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Project", left, y);

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Project name: ${projectName || ""}`, left, y);
    y += 5;

    doc.text(`Client name: ${clientName || ""}`, left, y);
    y += 5;

    const addr = `Site address: ${siteAddress || ""}`;
    const addrWrapped = doc.splitTextToSize(addr, 182);
    doc.text(addrWrapped, left, y);
    y += addrWrapped.length * 5;

    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Configuration", left, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    const cfg = selectedProduct ? configLine : "";
    const configWrapped = doc.splitTextToSize(cfg, 182);
    doc.text(configWrapped, left, y);
    y += Math.max(1, configWrapped.length) * 5 + 2;

    doc.setFont("helvetica", "bold");
    doc.text("Measurements", left, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Length × Width = Area: ${fmtNum2(L)} m × ${fmtNum2(W)} m = ${fmtNum2(area)} m²`,
      left,
      y
    );

    y += 8;
    doc.setFont("helvetica", "bold");
    // helper: key-value row (left label, right value)
    function kvRow(label, value) {
      doc.text(label, left, y);
      doc.text(value, 196, y, { align: "right" });
      y += 5.5;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Pricing", left, y);
    y += 7;
    doc.setFont("helvetica", "normal");

    kvRow("Unit rate", selectedProduct ? `$${unitRate} / m²` : "—");
    kvRow("Base subtotal", fmtMoney(baseSubtotal));
    kvRow("Add-ons subtotal", fmtMoney(addonsSubtotal));
    kvRow("Custom add-ons", fmtMoney(customSubtotal));

    doc.setDrawColor(220);
    doc.line(left, y, 196, y);
    y += 7;

    doc.setFont("helvetica", "bold");
    kvRow("Total", fmtMoney(total));
    doc.setFont("helvetica", "bold");
    kvRow(
      roundingApplied ? "Deal price (rounded down to $100)" : "Deal price (no rounding)",
      roundingApplied ? fmtMoneyInt(dealPrice) : fmtMoney(dealPrice)
    );

    doc.setFont("helvetica", "normal");
    kvRow("Deposit (50%)", roundingApplied ? fmtMoneyInt(deposit) : fmtMoney(deposit));
  kvRow("Balance", roundingApplied ? fmtMoneyInt(balance) : fmtMoney(balance));
  // Deposit paid status
  kvRow("Deposit paid", depositPaid ? "Yes" : "No");

    // Add-ons detail lines
    if (addonLines.length) {
      y += 2;
      doc.setDrawColor(220);
      doc.line(left, y, 196, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Add-ons (details)", left, y);
      y += 6;
      doc.setFont("helvetica", "normal");

      addonLines.forEach((a) => {
        const row = `${a.labelEn}: ${fmtNum2(a.qty)} × ${a.unitLabel.replace("$", "$")} = ${fmtMoney(a.subtotal)}`;
        const wrapped = doc.splitTextToSize(row, 182);
        doc.text(wrapped, left, y);
        y += wrapped.length * 5;
      });
    }

    // Custom add-ons detail
    const customRows = customAddons
      .map((r) => ({
        name: (r.name || "").trim(),
        amount: parseFloat(r.amount),
      }))
      .filter((r) => r.name && Number.isFinite(r.amount) && r.amount > 0);

    if (customRows.length) {
      y += 2;
      doc.setDrawColor(220);
      doc.line(left, y, 196, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Custom add-ons (details)", left, y);
      y += 6;
      doc.setFont("helvetica", "normal");

      customRows.forEach((r) => {
        const row = `${r.name}: ${fmtMoney(r.amount)}`;
        const wrapped = doc.splitTextToSize(row, 182);
        doc.text(wrapped, left, y);
        y += wrapped.length * 5;
      });
    }

    y += 4;
    doc.setDrawColor(220);
    doc.line(left, y, 196, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    y += 4;

    // grey box
    doc.setFillColor(245, 245, 245);
    doc.rect(left, y, 182, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Terms", left + 3, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const terms = [
      // "- Price includes GST.",
      "- Balance is due in full on the installation completion day.",
    ];

    const safeTerms = terms.map(t => t.replaceAll("&", ""));
    const wrapped = safeTerms.flatMap(t => doc.splitTextToSize(t, 175));
    doc.text(wrapped, left + 3, y + 13);


    const fileSafeName = (projectName || "ArchiMart_Quote")
      .replace(/[^\w-]+/g, "_")
      .slice(0, 48);

    doc.save(`${fileSafeName}_${quoteNo}.pdf`);
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h-title">ArchiMart Instant Quote</h1>
          <p className="h-sub">
            Enter size (metres), choose a configuration, add optional items, and download a PDF quote.
          </p>
        </div>
        <div className="badge">
          <div><b>{COMPANY.name}</b></div>
          <div>ABN: {COMPANY.abn}</div>
          <div>Phone: {COMPANY.phone}</div>
          <div style={{ marginTop: 6 }}>
            Quote No: <b>{quoteNo}</b>
          </div>
          <div className="pill">No data storage</div>
        </div>
      </div>

      <div className="grid">
        {/* Left: inputs */}
        <div className="card">
          <h2>1) Project details</h2>

          <div className="field">
            <div className="label">Project name</div>
            <input
              className="input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Burwood East Decking / Backyard Awning"
            />
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <div className="field">
              <div className="label">Client name</div>
              <input
                className="input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., Yaotian Liu"
              />
            </div>

            <div className="field">
              <div className="label">Site address</div>
              <input
                className="input"
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="e.g., 4 Robinlee Ave, Burwood East VIC 3151"
              />
            </div>
          </div>

          <div className="hr" />

          <h2>2) Size (metres)</h2>
          <div className="row">
            <div className="field">
              <div className="label">Length (m)</div>
              <input
                className="input"
                inputMode="decimal"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g., 8.88"
              />
            </div>
            <div className="field">
              <div className="label">Width (m)</div>
              <input
                className="input"
                inputMode="decimal"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g., 6.66"
              />
            </div>
          </div>

          <div className="smallmuted">
            Area = {fmtNum2(L)} × {fmtNum2(W)} = <b>{fmtNum2(area)} m²</b>
            <br />
            Curved awning: please add <b>0.2m</b> to length / 弯棚结构长度请自行 <b>+0.2m</b>
          </div>

          <div className="hr" />

          <h2>3) Configuration</h2>
          <div className="chips">
            {PRICING.map((p) => (
              <Chip key={p.id} on={p.id === productId} onClick={() => onSelectProduct(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
          <div className="smallmuted">
            {selectedProduct ? (
              <>Selected unit rate: <b>{selectedProduct.hint}</b></>
            ) : (
              <>Please select a configuration first.</>
            )}
          </div>

          {/* Awning shape only when ALU_PC selected */}
          <div className="hr" />
          <h2>4) Awning shape (optional)</h2>
          <div className="chips">
            {AWNING_SHAPES.map((c) => (
              <Chip
                key={c.id}
                on={awningShape === c.id}
                onClick={() => setAwningShape(awningShape === c.id ? "" : c.id)}
                prefix={<ColorDot hex={c.dot} />}
                disabled={!isPcRoof}
              >
                {c.id}
              </Chip>
            ))}
          </div>
          {!isPcRoof && <div className="smallmuted">Only available for Aluminium + PC configuration.</div>}

          {/* Colour options gated by selected config */}
          <div className="hr" />
          <h2>{colorOptions ? colorOptions.title : "Material colour (optional)"}</h2>
          {colorOptions ? (
            <div className="chips">
              {colorOptions.list.map((c) => (
                <Chip
                  key={c.id}
                  on={colorOptions.value === c.id}
                  onClick={() => colorOptions.set(colorOptions.value === c.id ? "" : c.id)}
                  prefix={<ColorDot hex={c.dot} />}
                  disabled={!selectedProduct}
                >
                  {c.id}
                </Chip>
              ))}
            </div>
          ) : (
            <div className="smallmuted">Please select a configuration first.</div>
          )}

          <div className="hr" />

          {/* Add-ons section */}
          <h2>5) Add-ons (optional)</h2>
          <div className="note">
            Click an add-on, then enter quantity. Add-ons are included in the total automatically.
            <br />
            增加项：点击后输入数量，价格会自动加到总价里。
          </div>

          {selectedProduct ? (
            <>
              {/* Awning add-ons */}
              {isPcRoof && (
                <>
                  <div className="smallmuted"><b>Awning add-ons / 雨棚增加项</b></div>
                  <div className="chips" style={{ marginTop: 8 }}>
                    {AWNING_ADDONS.map((a) => {
                      const qty = addonQty[a.id] ?? "";
                      const on = (parseFloat(qty) || 0) > 0;
                      return (
                        <div key={a.id} style={{ width: "100%" }}>
                          <Chip
                            on={on}
                            onClick={() => {
                              // toggle: if off -> set default "1", if on -> clear
                              setQty(a.id, on ? "" : "1");
                            }}
                          >
                            {a.labelZh} / {a.labelEn}
                          </Chip>
                          {on && (
                            <div className="row" style={{ marginTop: 8 }}>
                              <div className="field">
                                <div className="label">Quantity</div>
                                <input
                                  className="input"
                                  inputMode="decimal"
                                  value={qty}
                                  onChange={(e) => setQty(a.id, e.target.value)}
                                  placeholder={a.qtyType === "int" ? "1" : "0.00"}
                                />
                              </div>
                              <div className="field">
                                <div className="label">Info</div>
                                <div className="smallmuted">
                                  <b>{a.unitLabel}</b> — {a.explain}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Decking add-ons */}
              {isDecking && (
                <>
                  <div className="smallmuted" style={{ marginTop: 10 }}>
                    <b>Decking add-ons / 地板增加项</b>
                  </div>
                  <div className="chips" style={{ marginTop: 8 }}>
                    {DECKING_ADDONS.map((a) => {
                      const qty = addonQty[a.id] ?? "";
                      const on = (parseFloat(qty) || 0) > 0;
                      return (
                        <div key={a.id} style={{ width: "100%" }}>
                          <Chip
                            on={on}
                            onClick={() => {
                              setQty(a.id, on ? "" : "1");
                            }}
                          >
                            {a.labelZh} / {a.labelEn}
                          </Chip>
                          {on && (
                            <div className="row" style={{ marginTop: 8 }}>
                              <div className="field">
                                <div className="label">
                                  {a.id === "extra_side_cladding" ? "Area (m²)" : "Quantity"}
                                </div>
                                <input
                                  className="input"
                                  inputMode="decimal"
                                  value={qty}
                                  onChange={(e) => setQty(a.id, e.target.value)}
                                  placeholder={a.qtyType === "int" ? "1" : "0.00"}
                                />
                              </div>
                              <div className="field">
                                <div className="label">Info</div>
                                <div className="smallmuted">
                                  <b>{a.unitLabel}</b> — {a.explain}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {!isPcRoof && !isDecking && (
                <div className="smallmuted">No add-ons available for this configuration.</div>
              )}

              <div className="hr" />

              {/* Custom add-ons */}
              <h2>6) Custom add-ons (manual)</h2>
              <div className="note">
                Add any extra charge items here (e.g., demolition, rubbish removal). Name + total amount.
                <br />
                手动增加项：填写名称与加钱总额（例如：拆除旧雨棚、拆除旧decking、垃圾处理等）。
              </div>

              {customAddons.map((row, idx) => (
                <div className="row" key={idx} style={{ marginTop: 10 }}>
                  <div className="field">
                    <div className="label">Name</div>
                    <input
                      className="input"
                      value={row.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomAddons((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], name: v };
                          return next;
                        });
                      }}
                      placeholder={
                        idx === 0
                          ? "e.g., Demolition of old awning / 拆除旧雨棚"
                          : idx === 1
                          ? "e.g., Demolition of old decking / 拆除旧decking"
                          : "e.g., Rubbish removal (bin cost based) / 垃圾处理"
                      }
                    />
                  </div>
                  <div className="field">
                    <div className="label">Amount ($)</div>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={row.amount}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCustomAddons((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], amount: v };
                          return next;
                        });
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="smallmuted">Please select a configuration first.</div>
          )}

          {/* 7) Deposit paid? */}
          <div className="hr" />
          <h2>7) Deposit paid?</h2>
          <div className="smallmuted">Mark whether the deposit has already been paid. This will appear on the quote and PDF.</div>
          <div className="chips" style={{ marginTop: 8 }}>
            <Chip on={depositPaid} onClick={() => setDepositPaid(true)}>Paid</Chip>
            <Chip on={!depositPaid} onClick={() => setDepositPaid(false)}>Not paid</Chip>
          </div>

          <div className="btnRow" style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={downloadPDF} disabled={!selectedProduct}>
              Download Quote (PDF)
            </button>
            <button
              className="btn"
              onClick={() => {
                setProjectName("");
                setClientName("");
                setSiteAddress("");
                setLength("0.00");
                setWidth("0.00");
                setProductId("");
                setPcColor("");
                setDeckColor("");
                setAwningShape("");
                setAddonQty({});
                setCustomAddons([{ name: "", amount: "" }, { name: "", amount: "" }, { name: "", amount: "" }]);
                setDepositPaid(false);
              }}
            >
              Reset
            </button>
          </div>

          <div className="note">

          </div>
        </div>

        {/* Right: summary */}
        <div className="card">
          <h2>Quote summary</h2>

          <div className="kv">
            <div className="k">Quote No</div>
            <div className="v">{quoteNo}</div>
          </div>

          <div className="kv">
            <div className="k">Project name</div>
            <div className="v">{projectName || "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Client</div>
            <div className="v">{clientName || "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Site address</div>
            <div className="v">{siteAddress || "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Configuration</div>
            <div className="v">{selectedProduct ? selectedProduct.label : "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Options</div>
            <div className="v">
              {isPcRoof ? (
                <>
                  {awningShape ? `Shape: ${awningShape}` : "Shape: —"}
                  <br />
                  {pcColor ? `PC: ${pcColor}` : "PC: —"}
                </>
              ) : isDecking ? (
                <>
                  {deckColor ? `Decking: ${deckColor}` : "Decking: —"}
                </>
              ) : (
                "—"
              )}
            </div>
          </div>

          <div className="kv">
            <div className="k">Size</div>
            <div className="v">
              {fmtNum2(L)} m × {fmtNum2(W)} m
              <br />
              Area: <b>{fmtNum2(area)} m²</b>
            </div>
          </div>

          <div className="hr" />

          <div className="kv">
            <div className="k">Unit rate</div>
            <div className="v">{selectedProduct ? <><b>${unitRate}</b> / m²</> : "—"}</div>
          </div>

          <div className="kv">
            <div className="k">Base subtotal</div>
            <div className="v">{fmtMoney(baseSubtotal)}</div>
          </div>

          <div className="kv">
            <div className="k">Add-ons subtotal</div>
            <div className="v">{fmtMoney(addonsSubtotal)}</div>
          </div>

          <div className="kv">
            <div className="k">Custom add-ons</div>
            <div className="v">{fmtMoney(customSubtotal)}</div>
          </div>

          <div className="kv">
            <div className="k">Total</div>
            <div className="v big">{fmtMoney(total)}</div>
          </div>

          <div className="kv">
            <div className="k">
              Deal price{" "}
              <span className="pill">
                {roundingApplied ? "rounded to $100" : "no rounding"}
              </span>
            </div>
            <div className="v big green">
              {roundingApplied ? fmtMoneyInt(dealPrice) : fmtMoney(dealPrice)}
            </div>
          </div>

          <div className="kv">
            <div className="k">Deposit (50%)</div>
            <div className="v">{roundingApplied ? fmtMoneyInt(deposit) : fmtMoney(deposit)}</div>
          </div>

          <div className="kv">
            <div className="k">Balance</div>
            <div className="v">{roundingApplied ? fmtMoneyInt(balance) : fmtMoney(balance)}</div>
          </div>

          <div className="kv">
            <div className="k">Deposit status</div>
            <div className="v">{depositPaid ? "Paid" : "Not paid"}</div>
          </div>

          <div className="note">
            {/* Price includes GST. */}
            <br />
            Balance is due in full on the installation completion day.
          </div>
        </div>
      </div>
    </div>
  );
}
