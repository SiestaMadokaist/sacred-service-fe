import { Item } from "./constants";
import { Formula, ICost } from "./formula";
import { aggregateCost, ICostEntry, printEntries } from "./helper";
import { $setup } from "./library";

export type Lib = { [K in Item]: Formula<K> };
export type YieldLimit = Partial<Record<Item, number>>;

export interface IPerItemResult {
    name: string;
    valuePerMinute: number;
    productPerMinute: number;
    costs: ICostEntry[];
}

export interface ITotalCostResult {
    perItem: IPerItemResult[];
    total: ICostEntry[];
    totalValuePerMinute: number;
}

// export const setup: Setup = $setup;
export class Setup {
    constructor(private props: Lib) {}

    get<K extends Item>(k: K): Formula<K> {
        return this.props[k];
    }

    computeTotalCost(desired: ICost[]): ITotalCostResult {
        const allOriginCost: ICost[] = [];
        const perItem: IPerItemResult[] = [];
        for (const d of desired) {
            const formula = this.get(d.item);
            const originCost = formula.originCost(this);
            const multipliedCost: ICost[] = originCost.map((x) => ({ ...x, amount: x.amount * d.amount, inputNeeded: x.inputNeeded * d.amount }))
            allOriginCost.push(...multipliedCost);
            const valuePerMinute = formula.valuePerMinute() * d.amount;
            const productPerMinute = formula.productPerMinute() * d.amount;
            perItem.push({ name: `${d.amount}x ${Item[d.item]}`, valuePerMinute, productPerMinute, costs: aggregateCost(multipliedCost) });
        }
        perItem.sort((a, b) => b.valuePerMinute - a.valuePerMinute);
        const totalValuePerMinute = perItem.reduce((sum, p) => sum + p.valuePerMinute, 0);
        return { perItem, total: aggregateCost(allOriginCost), totalValuePerMinute };
    }

    printTotalCost(desired: ICost[], yieldLimit?: YieldLimit): void {
        const result = this.computeTotalCost(desired);
        for (const entry of result.perItem) {
            console.log(`Cost for ${entry.name}:`);
            printEntries(entry.costs, yieldLimit);
            console.log(``);
        }
        console.log(`Total Cost:`);
        printEntries(result.total, yieldLimit);
    }
}
export const setup = new Setup($setup);