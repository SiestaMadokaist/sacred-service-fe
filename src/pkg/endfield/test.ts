import { Item } from "./constants"
import { setup } from "./setup";

// const YieldLimit = {
//     Originium: 520,
//     Amethyst: 240,
//     Ferium: 470,
// }

function main(): void {
    const inputNeeded = 1;
    setup.printTotalCost([
        { item: Item.HCValleyBattery, amount: 1, inputNeeded },
        { item: Item.BuckCapsuleA, amount: 1, inputNeeded },
        // { item: Item.SteelBottle, amount: 1, inputNeeded },
        // // { item: Item.BuckCapsuleB, amount: 2, inputNeeded, },
        // { item: Item.LCValleyBattery, amount: 1, inputNeeded, },
        // { item: Item.SCValleyBattery, amount: 1, inputNeeded, },
        // { item: Item.CannedCitromeC, amount: 1, inputNeeded, },
        // // { item: Item.SteelPart, amount: 1, inputNeeded, },
        { item: Item.CrystonPart, amount: 1, inputNeeded, },
        // { item: Item.AmethystBottle, amount: 1, inputNeeded },
        // { item: Item.FeriumBottle, amount: 1, inputNeeded },
        { item: Item.Origocrust, amount: 1, inputNeeded },
        // { item: Item.Steel, amount: 1, inputNeeded },
        { item: Item.FeriumPart, amount: 1, inputNeeded },
        { item: Item.Carbon, amount: 1, inputNeeded },
        // { item: Item.DenseOrigocrustPowder, amount: 1, inputNeeded },
    ])
}

if (require.main === module) {
    main();
}

// canned citrome: 6/min
// buck capsule: 6/min
// lcv_bat: 12/min
// scv_bat: 6/min
// steel_part: 30/min
// hcv_bat: 3/min
