import { Item } from "./constants";
import { Formula, ICost } from "./formula";
import { printCost } from "./helper";
import { $setup } from "./library";

export type Lib = { [K in Item]: Formula<K> };
// export const setup: Setup = $setup;
export class Setup {
    constructor(private props: Lib) {}

    get<K extends Item>(k: K): Formula<K> {
        return this.props[k];
    }

    printTotalCost(desired: ICost[]): void {
        const allOriginCost: ICost[] = [];
        for (const d of desired) {
            const formula = this.get(d.item);
            const originCost = formula.originCost(this);
            const multipliedCost: ICost[] = originCost.map((x) => ({ ...x, amount:  x.amount * d.amount, inputNeeded: x.inputNeeded * d.amount }))
            allOriginCost.push(...multipliedCost);
            console.log(`Cost for ${d.amount}* ${Item[d.item]}:`);
            printCost(multipliedCost);
            console.log(``)
        }
        console.log(`Total Cost:`)
        printCost(allOriginCost);
    }
}
export const setup = new Setup($setup);