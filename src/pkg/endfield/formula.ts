import { Memoizer } from "./helper";
import { Item } from "./constants";
import { type Setup } from "./setup";


type Amount = number & { __brand?: 'amount' };
type Price = number & { __brand?: 'price' };
type InputNeeded = number & { __brand?: 'input-needed' };
type Second = number & { __brand?: 'Second' };
type Minute = number & { __brand?: 'Minute' };

export interface ICost {
    item: Item;
    amount: Amount;
    inputNeeded: InputNeeded;
}

export interface IFormula<K extends Item> {
    id: K;
    cost: ICost[];
    price: Price;
    productionTime: Second;
}

export class Formula<Key extends Item> {
    private memo = new Memoizer<{ 
        normalizedCost: ICost[];
        originCost: ICost[];
        treeCost: ICost[];
    }>()
    private props: IFormula<Key>;
    constructor(name: Key, productionTime: Second, cost: [Item, Amount, InputNeeded][], price: Price = 0) {
        this.props = {
            id: name,
            price: price,
            productionTime,
            cost: cost.map(([item, amount, inputNeeded]) => ({ item, amount, inputNeeded }))
        }
    }

    id(): Item {
        return this.props.id;
    }

    name(): string {
        return Item[this.id()];
    }

    originCost(setup: Setup): ICost[] {
        return this.memo.memoize('originCost', () => {
            if (this.isRoot()) {
                return [{ amount: 1, item: this.id(), inputNeeded: 1 }]
            }
            const result: ICost[] = [];
            const ownCost = this.cost();
            for (const c of ownCost) {
                const f = setup.get(c.item)
                const originCost = f.originCost(setup);
                const multipliedCost = originCost.map((x) => ({ 
                    ...x, 
                    amount: x.amount * c.amount,
                    inputNeeded: x.inputNeeded * c.inputNeeded,
                }))
                result.push(...multipliedCost);
            }
            return result;
        })
    }

    private cost(): ICost[] {
        return this.props.cost;
    }

    price(): number {
        return this.props.price;
    }

    productionTime(): number {
        return this.props.productionTime;
    }

    productPerMinute(): number {
        return 60 / this.props.productionTime;
    }

    valuePerMinute(): number {
        return this.props.price * this.productPerMinute();
    }

    isRoot(): boolean {
        return this.cost().length === 0;
    }

}