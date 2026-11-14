/**
 * 金融工具：savings goal — 金融计算
 */

export const name = "dsh-fin-savings-goal";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/tools/";
const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

function n(v) { const x = Number(String(v).replace(/[^\d.-]/g, "")); if (!Number.isFinite(x)) throw new Error("需要数字"); return x; }
function f(x) { return (Math.round(x * 100) / 100).toString(); }
function pmt(p, r, m) { if (r === 0) return p / m; return p * r * Math.pow(1 + r, m) / (Math.pow(1 + r, m) - 1); }

const OPS = {
  loan_amortization: (t, a, b) => {
    const p = n(t), rate = n(a) / 100 / 12, months = n(b);
    if (months <= 0) throw new Error("期数无效");
    const pay = pmt(p, rate, months);
    let bal = p; const rows = ["期 | 月供 | 本金 | 利息 | 余额"];
    for (let i = 1; i <= Math.min(months, 12); i++) {
      const interest = bal * rate; const principal = pay - interest; bal -= principal;
      rows.push(i + " | " + f(pay) + " | " + f(principal) + " | " + f(interest) + " | " + f(Math.max(0, bal)));
    }
    if (months > 12) rows.push("…共 " + months + " 期，总利息 " + f(pay * months - p));
    return rows.join(NL);
  },
  mortgage_payment: (t, a, b) => { const p = n(t), rate = n(a) / 100 / 12, years = n(b); return "月供: " + f(pmt(p, rate, years * 12)) + "；总利息: " + f(pmt(p, rate, years * 12) * years * 12 - p); },
  savings_goal: (t, a, b) => { const goal = n(t), rate = n(a) / 100 / 12, months = n(b); const r = rate === 0 ? goal / months : goal * rate / (Math.pow(1 + rate, months) - 1); return "每月需存: " + f(r) + " 元"; },
  retirement_goal: (t, a, b) => { const need = n(t), years = n(a), rate = n(b) / 100 / 12; const months = years * 12; return "每月投入: " + f(need * rate / (Math.pow(1 + rate, months) - 1)) + " 元（" + years + " 年，" + n(b) + "% 年化）"; },
  apr_convert: (t) => { const apr = n(t) / 100; const ear = Math.pow(1 + apr / 12, 12) - 1; return "APR " + t + "% → 实际年化 EAR: " + f(ear * 100) + "%"; },
  rule72: (t) => { const r = n(t); return "72 法则: 约 " + f(72 / r) + " 年翻倍（" + r + "% 年化）"; },
  real_return: (t, a) => { const nom = n(t) / 100, inf = n(a) / 100; return "实际收益率: " + f(((1 + nom) / (1 + inf) - 1) * 100) + "%"; },
  fee_adjusted_return: (t, a) => { const gross = n(t) / 100, fee = n(a) / 100; return "费后收益: " + f((gross - fee) * 100) + "%"; },
  compound_freq: (t, a, b) => { const p = n(t), rate = n(a) / 100, years = n(b); const out = []; [[1, "年"], [12, "月"], [365, "日"]].forEach(([k, name]) => out.push(name + "复利: " + f(p * Math.pow(1 + rate / k, k * years)))); return out.join(NL); },
  card_payoff: (t, a, b) => { const bal = n(t), apr = n(a) / 100 / 12, pay = n(b); if (pay <= bal * apr) return "月供不足以覆盖利息，无法还清"; let m = 0, rest = bal; while (rest > 0 && m < 1200) { rest = rest * (1 + apr) - pay; m++; } return "还清需 " + m + " 个月，利息约 " + f(Math.max(0, pay * m - bal)); },
  break_even_fee: (t, a) => { const gain = n(t), fee = n(a); return "回本需要收益: " + f(gain + fee) + "（含 " + fee + " 费用）"; },
  percent_rank: (t, a) => { const v = n(t); const list = String(a).split(",").map(Number).filter(Number.isFinite).sort((x, y) => x - y); if (!list.length) throw new Error("需要对照数值"); const below = list.filter((x) => x <= v).length; return "百分位: " + f(below / list.length * 100) + "%（低于/等于 " + below + "/" + list.length + "）"; },
};

export function apply(ctx, config) {
  void config;
  ctx.tools.register({
    name: "savings_goal",
    description: "savings goal",
    parameters: {
      text: { "type": "string", required: true, "description": "输入" },
      a: { "type": "string", "description": "参数 a" },
      b: { "type": "string", "description": "参数 b" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      const t = args && args.text != null ? String(args.text) : "";
      const a = args && args.a != null ? String(args.a) : "";
      const b = args && args.b != null ? String(args.b) : "";
      try {
        const fn = OPS["savings_goal"];
        if (!fn) throw new Error("未知操作");
        return { text: ["金融工具：savings goal", "=".repeat(52), String(fn(t, a, b)), "", "更多工具：" + SITE].join(NL) };
      } catch (e) {
        return { text: "处理失败: " + String((e && e.message) || e) };
      }
    },
  });
}
