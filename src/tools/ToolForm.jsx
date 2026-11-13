import { useState } from "react";
import {
  ageResult,
  discountResult,
  electricityResult,
  fuelResult,
  gpaResult,
  marksResult,
  mergeSettings,
  money,
  percentageResult,
  trimNum,
  zakatResult,
} from "./calc";

export default function ToolForm({ tool, currency }) {
  const settings = mergeSettings(tool);
  const signature = `${tool.slug}:${JSON.stringify(tool.settings || {})}`;
  const [stamp, setStamp] = useState(signature);
  const [state, setState] = useState(() => initialState(tool));
  if (stamp !== signature) {
    setStamp(signature);
    setState(initialState(tool));
  }

  function set(key, value) {
    setState((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="calc" onSubmit={(event) => event.preventDefault()}>
      {tool.kind === "zakat" && <ZakatForm state={state} set={set} settings={settings} currency={currency} />}
      {tool.kind === "electricity" && <PowerForm state={state} set={set} settings={settings} currency={currency} />}
      {tool.kind === "fuel" && <FuelForm state={state} set={set} currency={currency} />}
      {tool.kind === "discount" && <DiscountForm state={state} set={set} currency={currency} />}
      {tool.kind === "percentage" && <PercentForm state={state} set={set} />}
      {tool.kind === "gpa" && <GpaForm state={state} setState={setState} />}
      {tool.kind === "age" && <AgeForm state={state} set={set} />}
    </form>
  );
}

function initialState(tool) {
  const settings = mergeSettings(tool);
  if (tool.kind === "fuel") return { distance: "", efficiency: "", price: String(settings.price ?? ""), people: "2" };
  if (tool.kind === "percentage") return { mode: "of", a: "", b: "" };
  if (tool.kind === "gpa") return { rows: [{ credits: "3", grade: "" }, { credits: "3", grade: "" }, { credits: "3", grade: "" }], obtained: "", total: "" };
  if (tool.kind === "age") return { date: "" };
  if (tool.kind === "electricity") return { units: "" };
  if (tool.kind === "discount") return { price: "", percent: "" };
  return { cash: "", goldTola: "", silverTola: "", goods: "", receivable: "", debts: "" };
}

function Field({ label, hint, children }) {
  return (
    <label className="calc-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function Num({ label, value, onChange, hint, step = "any" }) {
  return (
    <Field label={label} hint={hint}>
      <input inputMode="decimal" step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function Result({ label, value, note }) {
  return (
    <div className="result">
      <p className="eyebrow">{label}</p>
      <strong>{value}</strong>
      {note ? <p>{note}</p> : null}
    </div>
  );
}

function ZakatForm({ state, set, settings, currency }) {
  const result = zakatResult(state, settings);
  return (
    <>
      <Num label={`Cash and bank (${currency})`} value={state.cash} onChange={(value) => set("cash", value)} />
      <Num label="Gold (tola)" value={state.goldTola} onChange={(value) => set("goldTola", value)} hint={`Sample price ${money(settings.goldPerTola, currency)} per tola`} />
      <Num label="Silver (tola)" value={state.silverTola} onChange={(value) => set("silverTola", value)} hint={`Sample price ${money(settings.silverPerTola, currency)} per tola`} />
      <Num label={`Trade goods (${currency})`} value={state.goods} onChange={(value) => set("goods", value)} />
      <Num label={`Money owed to you (${currency})`} value={state.receivable} onChange={(value) => set("receivable", value)} />
      <Num label={`Debts you subtract (${currency})`} value={state.debts} onChange={(value) => set("debts", value)} />
      <Result
        label={result.above ? "Zakat due" : "Below silver nisab"}
        value={money(result.above ? result.due : 0, currency)}
        note={`Wealth counted: ${money(result.assets, currency)}. Silver nisab: ${money(result.silverNisab, currency)}. Gold nisab is shown for reference at ${money(result.goldNisab, currency)}. Rate ${trimNum(result.rate)}%.`}
      />
    </>
  );
}

function PowerForm({ state, set, settings, currency }) {
  const result = electricityResult(state.units, settings);
  return (
    <>
      <Num label="Units" value={state.units} onChange={(value) => set("units", value)} hint="Current reading minus the previous reading." />
      <Result label="Estimated total" value={money(result.total, currency)} note="Sample slabs until the rates on this page are replaced. This is not a DISCO bill." />
      {result.rows.length > 0 && (
        <table className="rate-table">
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{trimNum(row.units)} × {money(row.rate, currency)}</td>
                <td>{money(row.cost, currency)}</td>
              </tr>
            ))}
            {result.fixed ? (
              <tr>
                <td>Fixed</td>
                <td />
                <td>{money(result.fixed, currency)}</td>
              </tr>
            ) : null}
            {result.tax ? (
              <tr>
                <td>Tax</td>
                <td />
                <td>{money(result.tax, currency)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      )}
    </>
  );
}

function FuelForm({ state, set, currency }) {
  const result = fuelResult(state);
  return (
    <>
      <Num label="Distance (km)" value={state.distance} onChange={(value) => set("distance", value)} />
      <Num label="Consumption (km per litre)" value={state.efficiency} onChange={(value) => set("efficiency", value)} />
      <Num label={`Price per litre (${currency})`} value={state.price} onChange={(value) => set("price", value)} />
      <Num label="People sharing" value={state.people} onChange={(value) => set("people", value)} />
      <Result label="Trip fuel" value={money(result.cost, currency)} note={`${trimNum(result.litres)} litres. ${money(result.each, currency)} for each of ${result.people}. Tolls are not included.`} />
    </>
  );
}

function DiscountForm({ state, set, currency }) {
  const result = discountResult(state.price, state.percent);
  return (
    <>
      <Num label={`Marked price (${currency})`} value={state.price} onChange={(value) => set("price", value)} />
      <Num label="Percent off" value={state.percent} onChange={(value) => set("percent", value)} />
      <Result label="You pay" value={money(result.pay, currency)} note={`Saved ${money(result.saved, currency)}. Tax and delivery are not added.`} />
    </>
  );
}

function PercentForm({ state, set }) {
  const result = percentageResult(state.mode, state.a, state.b);
  const modes = [
    ["of", "X% of Y"],
    ["is", "X is what % of Y"],
    ["increase", "Increase Y by X%"],
    ["decrease", "Decrease Y by X%"],
  ];
  return (
    <>
      <div className="mode-row" role="radiogroup" aria-label="Percentage mode">
        {modes.map(([id, label]) => (
          <label key={id} className={state.mode === id ? "on" : ""}>
            <input type="radio" name="percent-mode" checked={state.mode === id} onChange={() => set("mode", id)} />
            {label}
          </label>
        ))}
      </div>
      <Num label={state.mode === "of" || state.mode === "increase" || state.mode === "decrease" ? "Percent" : "First number"} value={state.a} onChange={(value) => set("a", value)} />
      <Num label={state.mode === "is" ? "Second number" : "Number"} value={state.b} onChange={(value) => set("b", value)} />
      <Result label="Result" value={result.suffix ? `${trimNum(result.value)}${result.suffix}` : trimNum(result.value)} note={result.label} />
    </>
  );
}

function GpaForm({ state, setState }) {
  const gpa = gpaResult(state.rows);
  const marks = marksResult(state.obtained, state.total);
  function update(index, key, value) {
    setState((current) => ({
      ...current,
      rows: current.rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)),
    }));
  }
  return (
    <>
      {state.rows.map((row, index) => (
        <div className="gpa-row" key={index}>
          <Num label={`Course ${index + 1} credits`} value={row.credits} onChange={(value) => update(index, "credits", value)} />
          <Num label="Grade point" value={row.grade} onChange={(value) => update(index, "grade", value)} hint="0 to 4" />
        </div>
      ))}
      <div className="inline-actions">
        <button type="button" className="btn btn-line" onClick={() => setState((current) => ({ ...current, rows: [...current.rows, { credits: "3", grade: "" }] }))}>
          Add course
        </button>
        {state.rows.length > 1 && (
          <button type="button" className="btn btn-line" onClick={() => setState((current) => ({ ...current, rows: current.rows.slice(0, -1) }))}>
            Remove last
          </button>
        )}
      </div>
      <Result label="GPA" value={trimNum(gpa.gpa)} note={`${trimNum(gpa.credits)} credit hours counted. Empty grade points are skipped.`} />
      <Num label="Obtained marks" value={state.obtained} onChange={(value) => setState((current) => ({ ...current, obtained: value }))} />
      <Num label="Total marks" value={state.total} onChange={(value) => setState((current) => ({ ...current, total: value }))} />
      <Result label="Marks as a percentage" value={`${trimNum(marks.percent)}%`} note="This percentage is not converted into a GPA." />
    </>
  );
}

function AgeForm({ state, set }) {
  const result = ageResult(state.date);
  return (
    <>
      <Field label="Date of birth">
        <input type="date" value={state.date} onChange={(event) => set("date", event.target.value)} />
      </Field>
      {result?.error && <p className="fine">{result.error}</p>}
      {result && !result.error && (
        <Result
          label="Age"
          value={`${result.years}y ${result.months}m ${result.days}d`}
          note={result.until === 0 ? `Birthday is today. ${result.lived.toLocaleString("en-PK")} days lived.` : `${result.until} days until the next birthday. ${result.lived.toLocaleString("en-PK")} days lived.`}
        />
      )}
    </>
  );
}
