import { Item } from "./constants";
import { Formula } from "./formula";
export const $setup = {
    [Item.FeriumOre]: new Formula(Item.FeriumOre, 1, []),
    [Item.OriginiumOre]: new Formula(Item.OriginiumOre, 1, []),
    [Item.AmethystOre]: new Formula(Item.AmethystOre, 1,  []),
    [Item.Sandleaf]: new Formula(Item.Sandleaf, 1, []),
    [Item.SandleafPowder]: new Formula(Item.SandleafPowder, 2/3, [[Item.Sandleaf, 1, 1]]),
    [Item.Buckflower]: new Formula(Item.Buckflower, 1, []),
    [Item.BuckflowerPowder]: new Formula(Item.BuckflowerPowder, 2/2, [[Item.Buckflower, 1, 1]]),
    [Item.Citrome]: new Formula(Item.Citrome, 2, []),
    [Item.CitromePowder]: new Formula(Item.CitromePowder, 2/2, [[Item.Citrome, 1, 1]]),
    [Item.HCValleyBattery]: new Formula(
        Item.HCValleyBattery,
        10,
        [[Item.SteelPart, 10, 2],
        [Item.DenseOriginiumPowder, 15, 3]],
        70,
    ),
    [Item.SteelPart]: new Formula(Item.SteelPart, 2, [[Item.Steel, 1, 1]]),
    [Item.DenseOriginiumPowder]: new Formula(
        Item.DenseOriginiumPowder,
        2,
        [[Item.OriginiumPowder, 2, 2],
        [Item.SandleafPowder, 1, 1]]
    ),
    [Item.OriginiumPowder]: new Formula(Item.OriginiumPowder, 2, [[Item.OriginiumOre, 1, 1]]),
    [Item.Steel]: new Formula(Item.Steel, 2, [[Item.DenseFeriumPowder, 1, 1]]),
    [Item.DenseFeriumPowder]: new Formula(
        Item.DenseFeriumPowder,
        2,
        [[Item.FeriumPowder, 2, 2],
        [Item.SandleafPowder, 1, 1]]
    ),
    [Item.FeriumPowder]: new Formula(Item.FeriumPowder, 2, [[Item.Ferium, 1, 1]]),
    [Item.Ferium]: new Formula(Item.Ferium, 2, [[Item.FeriumOre, 1, 1]]),

    [Item.CrystonPart]: new Formula(Item.CrystonPart, 2, [[Item.CrystonFiber, 1, 1]]),
    [Item.CrystonFiber]: new Formula(Item.CrystonFiber, 2, [[Item.CrystonPowder, 1, 1]]),
    [Item.CrystonPowder]: new Formula(Item.CrystonPowder, 2, [
        [Item.AmethystPowder, 2, 2],
        [Item.SandleafPowder, 1, 1],
    ]),
    [Item.BuckCapsuleB]: new Formula(
        Item.BuckCapsuleB, 10, [
            [Item.FeriumBottle, 10, 1],
            [Item.BuckflowerPowder, 10, 1]
        ], 27),
    [Item.FeriumBottle]: new Formula(Item.FeriumBottle, 2, [[Item.Ferium, 2, 2]]),
    [Item.SCValleyBattery]: new Formula(Item.SCValleyBattery, 10, [
        [Item.FeriumPart, 10, 2],
        [Item.OriginiumPowder, 15, 3]
    ], 30),
    [Item.FeriumPart]: new Formula(Item.FeriumPart, 2, [
        [Item.Ferium, 1, 1]
    ]),
    [Item.LCValleyBattery]: new Formula(Item.LCValleyBattery, 10, [
        [Item.AmethystPart, 5, 1],
        [Item.OriginiumPowder, 10, 2],
    ], 16),
    [Item.AmethystPart]: new Formula(Item.AmethystPart, 2, [
        [Item.AmethystFiber, 1, 1],
    ], 1),
    [Item.AmethystFiber]: new Formula(Item.AmethystFiber, 2, [
        [Item.AmethystOre, 1, 1],
    ]),

    [Item.BuckCapsuleC]: new Formula(Item.BuckCapsuleC, 10, [
        [Item.AmethystBottle, 5, 1],
        [Item.BuckflowerPowder, 5, 1],
    ], 10),

    [Item.CannedCitromeC]: new Formula(Item.CannedCitromeC, 2, [
        [Item.AmethystBottle, 5, 1],
        [Item.CitromePowder, 5, 1],
    ], 10),
    [Item.PackagedOrigocrust]: new Formula(Item.PackagedOrigocrust, 2, [[Item.DenseOrigocrustPowder, 1, 1]], 1),
    [Item.DenseOrigocrustPowder]: new Formula(Item.DenseOrigocrustPowder, 2, [[Item.DenseOriginiumPowder, 1, 1]], 1),
    [Item.CannedCitromeB]: new Formula(Item.CannedCitromeB, 10, [
        [Item.FeriumBottle, 5, 1],
        [Item.CitromePowder, 5, 1],
    ], 10),

    [Item.AmethystBottle]: new Formula(Item.AmethystBottle, 2,
        [[Item.AmethystFiber, 2, 2]
    ], 2),
    [Item.Origocrust]: new Formula(Item.Origocrust, 2, [[Item.OriginiumOre, 1, 1]], 1),
    [Item.AmethystPowder]: new Formula(Item.AmethystPowder, 2, [[Item.AmethystFiber, 1, 1]], 1),
    [Item.Carbon]: new Formula(Item.Carbon, 2, [[Item.Buckflower, 1, 1]], 1),
    [Item.CrystonBottle]: new Formula(Item.CrystonBottle, 2, [[Item.CrystonFiber, 2, 2]], 1),
    [Item.SteelBottle]: new Formula(Item.SteelBottle, 2, [[Item.Steel, 2, 2]], 1),
    [Item.GroundBuckflowerPowder]: new Formula(Item.GroundBuckflowerPowder, 2, [
        [Item.BuckflowerPowder, 2, 2],
        [Item.SandleafPowder, 1, 1],
    ], 1),
    [Item.BuckCapsuleA]: new Formula(Item.BuckCapsuleA, 10, [
        [Item.SteelBottle, 10, 2],
        [Item.GroundBuckflowerPowder, 10, 2]
    ], 70)
}

$setup satisfies { [K in Item]: Formula<K> };
// export const $setup
