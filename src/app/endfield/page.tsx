"use client";
import { useState, useMemo } from "react";
import useLocalStorage from "use-local-storage";
import { Input, Button, Table } from "reactstrap";
import { Item } from "../../pkg/endfield/constants";
import { setup, YieldLimit } from "../../pkg/endfield/setup";
import { ICostEntry } from "../../pkg/endfield/helper";

const itemNames = Object.keys(Item).filter((k) => isNaN(Number(k))) as (keyof typeof Item)[];
const sortedItemNames = [...itemNames].sort((a, b) => a.localeCompare(b));

const defaultYieldLimit: YieldLimit = {
    [Item.OriginiumOre]: 520,
    [Item.AmethystOre]: 240,
    [Item.FeriumOre]: 470,
};

const yieldLimitKeys = [
    { item: Item.OriginiumOre, label: "OriginiumOre" },
    { item: Item.AmethystOre, label: "AmethystOre" },
    { item: Item.FeriumOre, label: "FeriumOre" },
] as const;

interface DesiredItem {
    key: number;
    item: Item;
    amount: number;
}

interface StoredItem {
    item: Item;
    amount: number;
}

let nextKey = 0;

function toStored(items: DesiredItem[]): StoredItem[] {
    return items.map(({ item, amount }) => ({ item, amount }));
}

function fromStored(items: StoredItem[]): DesiredItem[] {
    return items.map(({ item, amount }) => ({ item, amount, key: nextKey++ }));
}

function CostRow({ entry, limit }: { entry: ICostEntry; limit?: number }) {
    const overBudget = limit !== undefined && entry.perMin > limit;
    return (
        <tr style={overBudget ? { background: "rgba(220, 53, 69, 0.15)" } : {}}>
            <td style={{ color: "#e2c07b" }}>{entry.name}</td>
            <td>{entry.amount}</td>
            <td>{entry.inputNeeded} input</td>
            <td>
                <span style={{ color: overBudget ? "#ff6b6b" : "#69db7c" }}>
                    {entry.perMin}/min
                </span>
                {overBudget && (
                    <span className="ms-2 badge bg-danger">
                        +{entry.perMin - limit!}
                    </span>
                )}
            </td>
        </tr>
    );
}

function CostTable({ entries, title, accent, yieldLimit }: { entries: ICostEntry[]; title: string; accent: string; yieldLimit: YieldLimit }) {
    if (entries.length === 0) return null;
    return (
        <div className="mb-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h6 style={{ color: accent, marginBottom: 12 }}>{title}</h6>
            <Table size="sm" dark hover borderless>
                <thead>
                    <tr style={{ color: "#888", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1 }}>
                        <th>Item</th>
                        <th>Amount</th>
                        <th>Input</th>
                        <th>Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e) => (
                        <CostRow key={e.item} entry={e} limit={yieldLimit[e.item]} />
                    ))}
                </tbody>
            </Table>
        </div>
    );
}

const perItemColors = ["#61afef", "#c678dd", "#56b6c2", "#e5c07b", "#98c379", "#e06c75"];

const fmt = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(1);

export default function EndfieldPage() {
    const [storedItems, setStoredItems] = useLocalStorage<StoredItem[]>("endfield-desired-items", []);
    const [desired, setDesired] = useState<DesiredItem[]>(() => fromStored(storedItems));
    const [selectedItem, setSelectedItem] = useState<string>(sortedItemNames[0]);
    const [yieldLimit, setYieldLimit] = useLocalStorage<YieldLimit>("endfield-yield-limit", defaultYieldLimit);

    const updateDesired = (next: DesiredItem[]) => {
        setDesired(next);
        setStoredItems(toStored(next));
    };

    const onSelectItem = (name: string) => {
        setSelectedItem(name);
        const item = Item[name as keyof typeof Item];
        updateDesired([...desired, { key: nextKey++, item, amount: 1 }]);
    };

    const removeItem = (key: number) => {
        updateDesired(desired.filter((d) => d.key !== key));
    };

    const updateAmount = (key: number, amount: number) => {
        updateDesired(desired.map((d) => (d.key === key ? { ...d, amount } : d)));
    };

    const result = useMemo(() => {
        if (desired.length === 0) return null;
        const costs = desired.map((d) => ({
            item: d.item,
            amount: d.amount,
            inputNeeded: 1,
        }));
        return setup.computeTotalCost(costs);
    }, [desired]);

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
            <div className="py-4 px-3" style={{ maxWidth: 1200, margin: "0 auto" }}>
                <h4 className="mb-1" style={{ color: "#e2c07b", fontWeight: 700 }}>
                    Endfield Cost Calculator
                </h4>
                <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: 24 }}>
                    Add items to calculate total origin resource cost
                </p>

                <div className="d-flex gap-4" style={{ alignItems: "flex-start" }}>
                    {/* Left: Input */}
                    <div style={{ width: 340, flexShrink: 0 }}>
                        <div className="mb-3">
                            <label className="form-label mb-1" style={{ color: "#aaa", fontSize: "0.8rem" }}>Select item to add</label>
                            <Input
                                type="select"
                                value={selectedItem}
                                onChange={(e) => onSelectItem(e.target.value)}
                                style={{ background: "#0d1b2a", color: "#e2c07b", border: "2px solid #e2c07b", fontWeight: 600, fontSize: "1rem" }}
                            >
                                {sortedItemNames.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </Input>
                        </div>

                        <div className="mb-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <h6 style={{ color: "#c8ccd4", marginBottom: 12 }}>Yield Limit (/min)</h6>
                            {yieldLimitKeys.map(({ item, label }) => (
                                <div key={item} className="d-flex align-items-center gap-2 mb-2">
                                    <label style={{ color: "#e2c07b", fontSize: "0.85rem", width: 120 }}>{label}</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        bsSize="sm"
                                        value={yieldLimit[item] ?? 0}
                                        onChange={(e) => setYieldLimit({ ...yieldLimit, [item]: Math.max(0, parseInt(e.target.value) || 0) })}
                                        style={{ background: "#0d1b2a", color: "#56b6c2", border: "2px solid #56b6c2", width: 90, fontWeight: 600 }}
                                    />
                                </div>
                            ))}
                        </div>

                        {desired.length > 0 && (
                            <div className="p-3 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <h6 style={{ color: "#c8ccd4", marginBottom: 12 }}>Selected Items</h6>
                                <Table size="sm" dark borderless className="mb-0">
                                    <thead>
                                        <tr style={{ color: "#888", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: 1 }}>
                                            <th>Item</th>
                                            <th style={{ width: 70 }}>Qty</th>
                                            <th style={{ width: 40 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {desired.map((d) => (
                                            <tr key={d.key}>
                                                <td style={{ color: "#e2c07b", verticalAlign: "middle" }}>{Item[d.item]}</td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        bsSize="sm"
                                                        value={d.amount}
                                                        onChange={(e) =>
                                                            updateAmount(d.key, Math.max(1, parseInt(e.target.value) || 1))
                                                        }
                                                        style={{ background: "#0d1b2a", color: "#61afef", border: "2px solid #61afef", width: 60, fontWeight: 600 }}
                                                    />
                                                </td>
                                                <td style={{ verticalAlign: "middle" }}>
                                                    <Button
                                                        outline
                                                        color="danger"
                                                        size="sm"
                                                        onClick={() => removeItem(d.key)}
                                                    >
                                                        x
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </div>

                    {/* Right: Output */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {result ? (
                            <>
                                <CostTable
                                    entries={result.total}
                                    title={`Total Cost${result.totalValuePerMinute ? ` — ${fmt(result.totalValuePerMinute)} Credit/min` : ""}`}
                                    accent="#69db7c"
                                    yieldLimit={yieldLimit}
                                />
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "16px 0" }} />
                                {result.perItem.map((entry, i) => (
                                    <CostTable
                                        key={i}
                                        entries={entry.costs}
                                        title={`Cost for ${entry.name}${entry.valuePerMinute ? ` — ${fmt(entry.valuePerMinute)} Credit/min (${fmt(entry.productPerMinute)}/min)` : ""}`}
                                        accent={perItemColors[i % perItemColors.length]}
                                        yieldLimit={yieldLimit}
                                    />
                                ))}
                            </>
                        ) : (
                            <div className="p-4 rounded text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", color: "#555" }}>
                                Select items to see cost breakdown
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
