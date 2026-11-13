export function num(value) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

export const settingDefaults = {
  zakat: { goldPerTola: 250000, silverPerTola: 300, goldNisabTola: 7.5, silverNisabTola: 52.5, rate: 2.5 },
  electricity: {
    fixed: 0,
    taxPercent: 0,
    slabs: [
      { upto: 100, rate: 20 },
      { upto: 200, rate: 30 },
      { upto: 300, rate: 40 },
      { upto: 400, rate: 48 },
      { upto: 0, rate: 60 },
    ],
  },
  fuel: { price: 270 },
};

export function mergeSettings(tool) {
  const defaults = settingDefaults[tool?.kind] || {};
  const settings = { ...defaults, ...(tool?.settings || {}) };
  if (tool?.kind === "electricity") {
    const slabs = Array.isArray(tool?.settings?.slabs) && tool.settings.slabs.length ? tool.settings.slabs : defaults.slabs;
    settings.slabs = slabs.map((slab) => ({ upto: num(slab.upto), rate: num(slab.rate) }));
  }
  return settings;
}

export function money(value, currency = "PKR") {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      maximumFractionDigits: Math.abs(amount) >= 100 || Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString("en-PK")}`;
  }
}

export function zakatResult(input, settings) {
  const goldPrice = num(settings.goldPerTola);
  const silverPrice = num(settings.silverPerTola);
  const gold = num(input.goldTola) * goldPrice;
  const silver = num(input.silverTola) * silverPrice;
  const assets = num(input.cash) + gold + silver + num(input.goods) + num(input.receivable) - num(input.debts);
  const goldNisab = num(settings.goldNisabTola) * goldPrice;
  const silverNisab = num(settings.silverNisabTola) * silverPrice;
  const rate = num(settings.rate) || 2.5;
  const above = silverNisab > 0 && assets >= silverNisab;
  return {
    gold,
    silver,
    assets,
    goldNisab,
    silverNisab,
    rate,
    above,
    due: above ? (assets * rate) / 100 : 0,
  };
}

export function electricityResult(units, settings) {
  let left = Math.max(0, num(units));
  let prev = 0;
  const rows = [];
  const slabs = settings.slabs || [];
  slabs.forEach((slab, index) => {
    const cap = num(slab.upto);
    const open = cap <= 0 || index === slabs.length - 1 && cap <= prev;
    const span = !open && cap > prev ? cap - prev : left;
    const take = Math.min(left, span);
    if (take > 0) {
      rows.push({
        label: !open && cap > prev ? `${prev + 1}–${cap}` : `${prev + 1}+`,
        units: take,
        rate: num(slab.rate),
        cost: take * num(slab.rate),
      });
      left -= take;
      if (cap > prev) prev = cap;
    } else if (cap > prev) prev = cap;
  });
  const energy = rows.reduce((sum, row) => sum + row.cost, 0);
  const fixed = num(settings.fixed);
  const tax = ((energy + fixed) * num(settings.taxPercent)) / 100;
  return { rows, energy, fixed, tax, total: energy + fixed + tax };
}

export function fuelResult(input) {
  const distance = Math.max(0, num(input.distance));
  const efficiency = num(input.efficiency);
  const price = Math.max(0, num(input.price));
  const people = Math.max(1, Math.round(num(input.people) || 1));
  const litres = efficiency > 0 ? distance / efficiency : 0;
  const cost = litres * price;
  return { litres, cost, each: cost / people, people };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function ageResult(iso, today = new Date()) {
  if (!iso) return null;
  const born = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(born.getTime())) return { error: "That date could not be read." };
  if (born > today) return { error: "Pick a date in the past." };
  let years = today.getFullYear() - born.getFullYear();
  let months = today.getMonth() - born.getMonth();
  let days = today.getDate() - born.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const next = new Date(today.getFullYear(), born.getMonth(), born.getDate());
  if (startOfDay(next) < startOfDay(today)) next.setFullYear(today.getFullYear() + 1);
  const until = Math.round((startOfDay(next) - startOfDay(today)) / 86400000);
  const lived = Math.round((startOfDay(today) - startOfDay(born)) / 86400000);
  return { years, months, days, until, lived };
}

export function percentageResult(mode, a, b) {
  const x = num(a);
  const y = num(b);
  if (mode === "is") return { label: `${trimNum(x)} is what percent of ${trimNum(y)}`, value: y ? (x / y) * 100 : 0, suffix: "%" };
  if (mode === "increase") return { label: `${trimNum(y)} after a ${trimNum(x)}% increase`, value: y * (1 + x / 100) };
  if (mode === "decrease") return { label: `${trimNum(y)} after a ${trimNum(x)}% decrease`, value: y * (1 - x / 100) };
  return { label: `${trimNum(x)}% of ${trimNum(y)}`, value: (x / 100) * y };
}

export function gpaResult(rows) {
  let points = 0;
  let credits = 0;
  for (const row of rows || []) {
    const weight = num(row.credits);
    if (weight <= 0 || row.grade === "") continue;
    points += weight * num(row.grade);
    credits += weight;
  }
  return { credits, gpa: credits ? points / credits : 0 };
}

export function marksResult(obtained, total) {
  const top = num(total);
  return { percent: top ? (num(obtained) / top) * 100 : 0 };
}

export function discountResult(price, percent) {
  const base = Math.max(0, num(price));
  const saved = base * (num(percent) / 100);
  return { saved, pay: base - saved };
}

export function trimNum(value) {
  const n = Number(value) || 0;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function slabLabel(slab, index, slabs) {
  const upto = num(slab.upto);
  if (upto <= 0 || index === slabs.length - 1 && upto <= num(slabs[index - 1]?.upto)) {
    const prev = num(slabs[index - 1]?.upto);
    return prev > 0 ? `Above ${prev}` : "All units";
  }
  const prev = index === 0 ? 0 : num(slabs[index - 1]?.upto);
  return prev > 0 ? `${prev + 1}–${upto} units` : `Up to ${upto} units`;
}
