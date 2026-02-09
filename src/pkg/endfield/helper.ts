import { Item } from "./constants";
import { ICost } from "./formula";

export class Memoizer<Store> {
  private store: Partial<Store> = {};

  memoize<K extends keyof Store>(k: K, cb: () => Store[K]): Store[K] {
    const stored = this.store[k];
    if (typeof stored === 'undefined') {
      const result = cb();
      this.store[k] = result;
      return result;
    }
    return stored as Store[K];
  }
}


export interface ICostEntry {
    item: Item;
    name: string;
    amount: number;
    inputNeeded: number;
    perMin: number;
}

export function aggregateCost(cost: ICost[]): ICostEntry[] {
    const unique: Partial<Record<Item, ICost>> = {}
    for (const c of cost) {
        const prev = unique[c.item] ?? { item: c.item, amount: 0, inputNeeded: 0 }
        prev.amount += c.amount
        prev.inputNeeded += c.inputNeeded
        unique[c.item] = prev
    }
    return Object.keys(unique).map((key) => {
        const c = unique[key as unknown as Item] as ICost;
        return {
            item: c.item,
            name: Item[c.item],
            amount: c.amount,
            inputNeeded: c.inputNeeded,
            perMin: c.inputNeeded * 30,
        }
    })
}

export function printEntries(entries: ICostEntry[], yieldLimit?: Partial<Record<Item, number>>): void {
    for (const e of entries) {
        const limit = yieldLimit?.[e.item];
        const warning = limit !== undefined && e.perMin > limit ? ` (WARNING: over budget by ${e.perMin - limit}/min)` : '';
        console.log(`${e.name.padEnd(15, ' ')} ${e.amount} => (${e.inputNeeded} input) = (${e.perMin}/min)${warning}`)
    }
}

export function printCost(cost: ICost[], yieldLimit?: Partial<Record<Item, number>>): void {
    printEntries(aggregateCost(cost), yieldLimit);
}
