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


export function printCost(cost: ICost[]): void {
    const unique: Partial<Record<Item, ICost>> = {}
    for (const c of cost) {
        const prev = unique[c.item] ?? { item: c.item,  amount: 0, inputNeeded: 0 }
        prev.amount += c.amount
        prev.inputNeeded += c.inputNeeded
        unique[c.item] = prev
    }
    for (const key of Object.keys(unique)) {
        const c = unique[key as unknown as Item] as ICost;
        console.log(`${Item[c.item].padEnd(15, ' ')} ${c.amount} => (${c.inputNeeded} input) = (${c.inputNeeded * 30}/min)`)
    }
}
