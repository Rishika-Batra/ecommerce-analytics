"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3, Users, TrendingUp, Layers, Play, FileText,
  RefreshCw, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Sparkles, Zap, Target, ChevronRight, Circle,
} from "lucide-react";

/* ─────────────────────────────────────────────
   MOCK DATA  (replace with real API responses)
───────────────────────────────────────────── */
const MOCK_METRICS = {
  total_revenue: "₹1,06,88,950",
  total_customers: "24,381",
  total_orders: "58,204",
  conversion_rate: "3.72%",
  average_revenue_per_customer: "₹4,375",
  revenue_change: +18.4,
  customer_change: +9.2,
  order_change: +14.1,
  conv_change: -0.3,
  aov_change: +4.8,
};

const MOCK_SALES_TREND = [
  { month: "Jan", revenue: 84200, orders: 3910 },
  { month: "Feb", revenue: 91400, orders: 4120 },
  { month: "Mar", revenue: 103800, orders: 4780 },
  { month: "Apr", revenue: 97600, orders: 4430 },
  { month: "May", revenue: 118400, orders: 5210 },
  { month: "Jun", revenue: 132700, orders: 5890 },
  { month: "Jul", revenue: 121500, orders: 5520 },
  { month: "Aug", revenue: 145200, orders: 6340 },
  { month: "Sep", revenue: 138900, orders: 6010 },
  { month: "Oct", revenue: 159300, orders: 6780 },
  { month: "Nov", revenue: 174800, orders: 7490 },
  { month: "Dec", revenue: 117120, orders: 5720 },
];

const MOCK_CATEGORIES = [
  { name: "Electronics", revenue: 412300, share: 32.1, color: "#7c6ff7" },
  { name: "Apparel", revenue: 284100, share: 22.1, color: "#34d399" },
  { name: "Home & Living", revenue: 198700, share: 15.5, color: "#fbbf24" },
  { name: "Beauty", revenue: 152400, share: 11.9, color: "#fb7185" },
  { name: "Sports", revenue: 118900, share: 9.3, color: "#38bdf8" },
  { name: "Other", revenue: 118520, share: 9.1, color: "#a78bfa" },
];

const MOCK_FUNNEL = [
  { stage: "Sessions", count: 284920, pct: 100 },
  { stage: "Product Views", count: 142460, pct: 50.0 },
  { stage: "Add to Cart", count: 56984, pct: 20.0 },
  { stage: "Checkout", count: 21369, pct: 7.5 },
  { stage: "Purchase", count: 10600, pct: 3.72 },
];

const MOCK_CUSTOMERS = [
  { id: "C-8821", name: "Priya Sharma", segment: "Champion", ltv: "₹3,55,240", orders: 34, last_order: "2 days ago", risk: "low" },
  { id: "C-4492", name: "Rohan Mehta", segment: "Loyal", ltv: "₹2,41,530", orders: 21, last_order: "5 days ago", risk: "low" },
  { id: "C-7731", name: "Ananya Patel", segment: "At Risk", ltv: "₹1,36,120", orders: 12, last_order: "62 days ago", risk: "high" },
  { id: "C-2209", name: "Vikram Singh", segment: "New", ltv: "₹25,730", orders: 2, last_order: "1 day ago", risk: "medium" },
  { id: "C-9918", name: "Kavya Nair", segment: "Champion", ltv: "₹4,24,960", orders: 41, last_order: "3 days ago", risk: "low" },
  { id: "C-3310", name: "Arjun Reddy", segment: "Hibernating", ltv: "₹73,870", orders: 7, last_order: "120 days ago", risk: "high" },
  { id: "C-6647", name: "Shruti Joshi", segment: "Loyal", ltv: "₹1,94,220", orders: 18, last_order: "8 days ago", risk: "low" },
  { id: "C-1123", name: "Devika Krishnan", segment: "Potential", ltv: "₹59,760", orders: 5, last_order: "14 days ago", risk: "medium" },
];

const MOCK_COHORT = [
  [100, 42, 28, 21, 17, 14, 11],
  [100, 38, 24, 18, 14, 11],
  [100, 44, 30, 23, 18],
  [100, 40, 26, 19],
  [100, 46, 31],
  [100, 43],
  [100],
];
const COHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function cn(...classes) { return classes.filter(Boolean).join(" "); }

function SparkBar({ data, color = "#7c6ff7" }) {
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div className="flex items-end gap-[3px] h-12">
      {data.map((d, i) => (
        <div
          key={i}
          style={{ height: `${(d.revenue / max) * 100}%`, background: color, opacity: i === data.length - 1 ? 1 : 0.35 }}
          className="flex-1 rounded-sm min-h-[2px] transition-all duration-300"
        />
      ))}
    </div>
  );
}

function Delta({ value }) {
  const up = value >= 0;
  return (
    <span className={cn("flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-400" : "text-rose-400")}>
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

function SegmentBadge({ segment }) {
  const map = {
    Champion: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    Loyal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "At Risk": "bg-amber-500/20 text-amber-300 border-amber-500/30",
    New: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Hibernating: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    Potential: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  };
  return (
    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", map[segment] || "bg-white/10 text-white/60 border-white/10")}>
      {segment}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SECTIONS
───────────────────────────────────────────── */
function KPISection({ metrics }) {
  const cards = [
    { label: "Total Revenue", value: metrics.total_revenue, icon: DollarSign, delta: metrics.revenue_change, color: "#7c6ff7" },
    { label: "Customers", value: metrics.total_customers, icon: Users, delta: metrics.customer_change, color: "#34d399" },
    { label: "Orders", value: metrics.total_orders, icon: ShoppingBag, delta: metrics.order_change, color: "#38bdf8" },
    { label: "Conv. Rate", value: metrics.conversion_rate, icon: Target, delta: metrics.conv_change, color: "#fbbf24" },
    { label: "Avg. Revenue / Customer", value: metrics.average_revenue_per_customer, icon: TrendingUp, delta: metrics.aov_change, color: "#fb7185" },
  ];
  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="glass-md rounded-xl p-4 flex flex-col gap-3 group hover:border-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40 tracking-wide uppercase">{c.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: c.color + "22" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
              </div>
            </div>
            <div className="text-[22px] font-semibold tracking-tight">{c.value}</div>
            <Delta value={c.delta} />
          </div>
        );
      })}
    </div>
  );
}

function RevenueChart({ data }) {
  const [hovered, setHovered] = useState(null);
  if (!Array.isArray(data) || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.revenue));
  return (
    <div className="glass-md rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-sm font-medium">Revenue trend</div>
          <div className="text-xs text-white/40 mt-0.5">Monthly, last 12 months</div>
        </div>
        <span className="text-xs text-white/30 font-mono">2025</span>
      </div>
      <div className="flex items-end gap-1.5 h-36 relative">
        {data.map((d, i) => {
          const h = (d.revenue / max) * 100;
          const isHov = hovered === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-default" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              {isHov && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-white/10 rounded-lg px-2.5 py-1.5 z-10 whitespace-nowrap pointer-events-none"
                  style={{ left: `${(i / data.length) * 100}%` }}>
                  <div className="text-xs font-medium">₹{(d.revenue / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-white/40">{d.orders} orders</div>
                </div>
              )}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-sm transition-all duration-200"
                  style={{
                    height: `${h}%`,
                    background: isHov ? "#7c6ff7" : "rgba(124,111,247,0.3)",
                    minHeight: 3,
                  }}
                />
              </div>
              <span className="text-[10px] text-white/25">{d.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FunnelChart({ funnel }) {
  if (!Array.isArray(funnel) || funnel.length === 0) return null;
  return (
    <div className="glass-md rounded-xl p-5">
      <div className="text-sm font-medium mb-1">Conversion funnel</div>
      <div className="text-xs text-white/40 mb-5">Session → purchase</div>
      <div className="flex flex-col gap-2">
        {funnel.map((stage, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 text-[11px] text-white/50 shrink-0 text-right">{stage.stage}</div>
            <div className="flex-1 h-7 bg-white/5 rounded-md overflow-hidden relative">
              <div
                className="h-full rounded-md transition-all duration-700 flex items-center px-2"
                style={{
                  width: `${stage.pct}%`,
                  background: `linear-gradient(90deg, rgba(124,111,247,${0.2 + (stage.pct / 100) * 0.5}), rgba(124,111,247,${0.1 + (stage.pct / 100) * 0.3}))`,
                }}
              >
                <span className="text-[10px] font-medium text-white/70 whitespace-nowrap">
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-12 text-[11px] text-white/40 font-mono">{stage.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }) {
  if (!Array.isArray(categories) || categories.length === 0) return null;
  return (
    <div className="glass-md rounded-xl p-5">
      <div className="text-sm font-medium mb-1">Revenue by category</div>
      <div className="text-xs text-white/40 mb-5">All time</div>
      <div className="flex flex-col gap-3">
        {categories.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: c.color }} />
            <div className="flex-1 text-xs text-white/70">{c.name}</div>
            <div className="w-28 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${c.share}%`, background: c.color + "cc" }} />
            </div>
            <div className="w-10 text-[11px] text-white/40 font-mono text-right">{c.share}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CohortTable({ cohort, months }) {
  function pctColor(v) {
    if (v === 100) return "#7c6ff7";
    if (v >= 40) return "rgba(124,111,247,0.7)";
    if (v >= 25) return "rgba(124,111,247,0.45)";
    if (v >= 15) return "rgba(124,111,247,0.3)";
    return "rgba(255,255,255,0.12)";
  }
  return (
    <div className="glass-md rounded-xl p-5 overflow-x-auto">
      <div className="text-sm font-medium mb-1">Cohort retention</div>
      <div className="text-xs text-white/40 mb-5">% customers retained by month</div>
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-white/30 font-normal pb-3 pr-3 whitespace-nowrap">Cohort</th>
            {months.map((m, i) => (
              <th key={i} className="text-white/30 font-normal pb-3 px-1 w-10">M{i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohort.map((row, ri) => (
            <tr key={ri}>
              <td className="pr-3 py-1 text-white/40 whitespace-nowrap">{months[ri]}</td>
              {row.map((v, ci) => (
                <td key={ci} className="px-1 py-1">
                  <div
                    className="rounded w-9 h-7 flex items-center justify-center font-mono text-[10px]"
                    style={{ background: pctColor(v), color: v === 100 ? "#fff" : "rgba(255,255,255,0.8)" }}
                  >
                    {v}%
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerTable({ customers }) {
  if (!Array.isArray(customers)) return null;
  const [search, setSearch] = useState("");
  const [seg, setSeg] = useState("All");
  const segs = ["All", "Champion", "Loyal", "At Risk", "New", "Hibernating", "Potential"];
  const filtered = customers.filter(c =>
    (seg === "All" || c.segment === seg) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search))
  );
  return (
    <div className="glass-md rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-medium">Customer segments</div>
          <div className="text-xs text-white/40 mt-0.5">RFM-based segmentation</div>
        </div>
        <input
          className="apple-input !w-48 text-xs"
          placeholder="Search customers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {segs.map(s => (
          <button
            key={s}
            onClick={() => setSeg(s)}
            className={cn(
              "text-[11px] px-3 py-1 rounded-full border transition-colors",
              seg === s
                ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5">
            {["ID", "Name", "Segment", "LTV", "Orders", "Last order", "Churn risk"].map(h => (
              <th key={h} className="text-left text-white/30 font-normal py-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="py-2.5 pr-4 font-mono text-white/30">{c.id}</td>
              <td className="py-2.5 pr-4 text-white/80">{c.name}</td>
              <td className="py-2.5 pr-4"><SegmentBadge segment={c.segment} /></td>
              <td className="py-2.5 pr-4 font-mono text-emerald-400">{c.ltv}</td>
              <td className="py-2.5 pr-4 text-white/50">{c.orders}</td>
              <td className="py-2.5 pr-4 text-white/40">{c.last_order}</td>
              <td className="py-2.5">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  c.risk === "low" && "bg-emerald-500/15 text-emerald-400",
                  c.risk === "medium" && "bg-amber-500/15 text-amber-400",
                  c.risk === "high" && "bg-rose-500/15 text-rose-400",
                )}>
                  {c.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SandboxSection() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const presets = [
    "Which customer segment has the highest churn risk?",
    "Predict LTV for a new customer who bought twice in 30 days",
    "What's the top product category by repeat purchase rate?",
    "Explain the biggest funnel drop-off and how to fix it",
  ];

  const answers = {
    "Which customer segment has the highest churn risk?":
      "The Hibernating segment (inactive 90–180 days) has the highest churn risk at 68%. There are currently 847 such customers. Recommended action: send a win-back campaign with a 15% discount — this cohort historically reactivates at 22% vs 8% for customers inactive 180+ days.",
    "Predict LTV for a new customer who bought twice in 30 days":
      "Predicted 12-month LTV: ₹8,240. Customers with 2 orders in the first 30 days fall into the high-potential segment. They have a 61% chance of becoming Loyal customers and a 34% chance of reaching Champion tier within 6 months.",
    "What\'s the top product category by repeat purchase rate?":
      "Beauty has the highest repeat purchase rate at 43%, followed by Apparel at 38%. Electronics has the highest AOV (₹12,400) but the lowest repeat rate (18%) — customers buy once and rarely return. Consider bundling or subscription offers for Electronics.",
    "Explain the biggest funnel drop-off and how to fix it":
      "The biggest drop-off is between Add to Cart (56,984) and Checkout (21,369) — a 62% drop. Top reasons from session data: unexpected shipping costs shown at checkout, no guest checkout option, and mobile users abandoning on the payment form. Fix: show shipping cost on the product page, enable guest checkout, and simplify the mobile payment flow.",
  };

  const runQuery = async (q) => {
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1000));
    const answer = answers[q] || "Based on the available data, I cannot find a confident answer for that query. Try rephrasing or ask about revenue trends, customer segments, funnel drop-off, or LTV prediction.";
    setResult({
      query: q,
      answer,
      model: "xgboost-ltv-v2",
      confidence: answers[q] ? "91%" : "42%",
    });
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="glass-md rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium">ML query sandbox</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 ml-auto">XGBoost + FastAPI</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          {presets.map((p, i) => (
            <button key={i} onClick={() => { setPrompt(p); runQuery(p); }}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors text-left">
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="apple-input flex-1"
            placeholder="Ask your ML models anything…"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && prompt && runQuery(prompt)}
          />
          <button
            onClick={() => prompt && runQuery(prompt)}
            className="px-4 py-2 rounded-xl bg-violet-600/40 border border-violet-500/40 text-violet-200 text-sm hover:bg-violet-600/60 transition-colors"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="glass-md rounded-xl p-5 flex items-center gap-3 text-white/40 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
          Running inference…
        </div>
      )}

      {result && (
        <div className="glass-md rounded-xl p-5 border-violet-500/20 border">
          <div className="flex items-center gap-2 mb-3 text-[11px] text-white/30">
            <span className="font-mono">{result.model}</span>
            <span>•</span>
            <span>confidence: {result.confidence}</span>
          </div>
          <div className="text-sm text-white/80 leading-relaxed">{result.answer}</div>
        </div>
      )}
    </div>
  );
}

function DocsSection() {
  const [expanded, setExpanded] = useState(null);
  const models = [
    {
      name: "stg_orders", layer: "staging",
      desc: "Cleaned orders from Shopify, cast types, filter deleted",
      columns: ["order_id", "customer_id", "ordered_at", "status", "order_total", "currency_code"],
      details: "Source: Shopify. Filters out soft-deleted rows (_fivetran_deleted = false). Casts total_price to NUMERIC and parses ISO timestamps. Used by all downstream order models.",
    },
    {
      name: "stg_customers", layer: "staging",
      desc: "Customer profiles with acquisition channel",
      columns: ["customer_id", "email", "first_name", "last_name", "acquisition_channel", "created_at"],
      details: "Source: Shopify customers API. Normalises acquisition_channel from UTM tags on first session. One row per customer.",
    },
    {
      name: "stg_sessions", layer: "staging",
      desc: "GA4 session_start events with UTM attribution",
      columns: ["session_id", "anonymous_id", "session_started_at", "utm_medium", "utm_source", "device_type"],
      details: "Source: GA4 BigQuery export. Filters only session_start events. Extracts UTM source/medium from traffic_source struct.",
    },
    {
      name: "int_orders_enriched", layer: "intermediate",
      desc: "Orders joined with customer segment + item count",
      columns: ["order_id", "customer_id", "customer_segment", "acquisition_channel", "calculated_total", "item_count"],
      details: "Joins stg_orders with stg_customers and stg_order_items. Computes calculated_total via window function as a sanity check against order_total.",
    },
    {
      name: "int_customer_order_history", layer: "intermediate",
      desc: "Per-customer order aggregates: LTV, AOV, recency",
      columns: ["customer_id", "order_count", "lifetime_revenue", "avg_order_value", "first_order_at", "last_order_at", "days_since_last_order"],
      details: "Aggregates completed orders per customer. Foundation for RFM segmentation and churn risk scoring. Only includes status = COMPLETED orders.",
    },
    {
      name: "mart_revenue", layer: "mart",
      desc: "Daily/monthly revenue, segmented by channel and category",
      columns: ["date", "channel", "category", "revenue", "orders", "aov"],
      details: "Materialized as a partitioned table on date. Powers the revenue trend chart. Clustered by channel for fast filtering.",
    },
    {
      name: "mart_cohort_retention", layer: "mart",
      desc: "Month-0 cohort retention matrix",
      columns: ["cohort_month", "period_number", "retained_customers"],
      details: "Groups customers by their first order month (cohort). Tracks how many return in subsequent months. Used to render the retention heatmap.",
    },
    {
      name: "mart_funnel", layer: "mart",
      desc: "Conversion funnel by UTM source, medium, device",
      columns: ["utm_source", "utm_medium", "device_type", "sessions", "product_views", "add_to_carts", "purchases", "conversion_rate"],
      details: "Pivots GA4 events into a funnel shape. Joins with orders to confirm purchases. Segmented by traffic source and device type.",
    },
    {
      name: "ml_ltv_features", layer: "ml",
      desc: "Feature table for XGBoost LTV prediction model",
      columns: ["customer_id", "order_count", "lifetime_revenue", "avg_order_value", "days_since_last_order", "customer_age_days", "acquisition_channel"],
      details: "Feature store for the LTV and churn XGBoost models. Refreshed daily. Fed into the FastAPI /predict endpoint for real-time scoring.",
    },
  ];
  const layerColor = { staging: "#7c6ff7", intermediate: "#34d399", mart: "#fbbf24", ml: "#fb7185" };

  return (
    <div className="glass-md rounded-xl p-5">
      <div className="text-sm font-medium mb-1">dbt model catalog</div>
      <div className="text-xs text-white/40 mb-5">Click any model to expand details</div>
      <div className="flex flex-col divide-y divide-white/5">
        {models.map((m, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <div
                className="flex items-center gap-4 py-3 hover:bg-white/3 -mx-2 px-2 rounded cursor-pointer transition-colors"
                onClick={() => setExpanded(isOpen ? null : i)}
              >
                <span className="text-[10px] px-2 py-0.5 rounded font-mono shrink-0" style={{ background: layerColor[m.layer] + "22", color: layerColor[m.layer] }}>
                  {m.layer}
                </span>
                <span className="font-mono text-xs text-white/70 w-52 shrink-0">{m.name}</span>
                <span className="text-xs text-white/35">{m.desc}</span>
                <ChevronRight className={cn("w-3 h-3 text-white/40 ml-auto shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
              </div>
              {isOpen && (
                <div className="mx-2 mb-3 p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-white/55 leading-relaxed mb-3">{m.details}</p>
                  <div className="text-[11px] text-white/30 mb-2 font-medium">Columns</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.columns.map((col, ci) => (
                      <span key={ci} className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/8 text-white/50">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [salesTrend, setSalesTrend] = useState(MOCK_SALES_TREND);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [funnel, setFunnel] = useState(MOCK_FUNNEL);
  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);

  const API_BASE = "http://localhost:8000";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [m, t, c, f, cu] = await Promise.all([
        fetch(`${API_BASE}/api/metrics/summary`).then(r => r.json()),
        fetch(`${API_BASE}/api/metrics/sales-trend`).then(r => r.json()),
        fetch(`${API_BASE}/api/metrics/categories`).then(r => r.json()),
        fetch(`${API_BASE}/api/metrics/funnel`).then(r => r.json()),
        fetch(`${API_BASE}/api/customers`).then(r => r.json()),
      ]);
      // Only use API data if it looks valid, otherwise keep mock
      if (m && m.total_revenue) setMetrics(m);
      if (Array.isArray(t) && t.length > 0) setSalesTrend(t);
      if (Array.isArray(c) && c.length > 0) setCategories(c);
      if (Array.isArray(f) && f.length > 0) setFunnel(f);
      if (Array.isArray(cu) && cu.length > 0) setCustomers(cu);
    } catch {
      // backend offline — keep mock data visible
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "customers", label: "Customers", icon: Users },
    { id: "sandbox", label: "Sandbox", icon: Sparkles },
    { id: "docs", label: "Docs", icon: FileText },
  ];

  return (
    <div className="animate-fadeUp">
      {/* Header */}
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ecommerce Analytics Engine</h1>
          <p className="text-white/40 text-sm mt-0.5">ML-powered customer intelligence platform</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-sm border text-sm text-white/60 hover:text-white/90 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Sync
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-7">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all",
                activeTab === t.id
                  ? "bg-violet-500/15 border-violet-500/30 text-violet-200"
                  : "glass-sm text-white/50 hover:text-white/80 hover:border-white/15"
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <>
          <KPISection metrics={metrics} />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <RevenueChart data={salesTrend} />
            <FunnelChart funnel={funnel} />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <CategoryBreakdown categories={categories} />
            <div className="col-span-2">
              <CohortTable cohort={MOCK_COHORT} months={COHORT_MONTHS} />
            </div>
          </div>
        </>
      )}

      {/* Customers */}
      {activeTab === "customers" && <CustomerTable customers={customers} />}

      {/* Sandbox */}
      {activeTab === "sandbox" && <SandboxSection />}

      {/* Docs */}
      {activeTab === "docs" && <DocsSection />}
    </div>
  );
}