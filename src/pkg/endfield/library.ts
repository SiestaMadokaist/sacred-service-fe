import { Item } from "./constants";
import { Formula } from "./formula";
export const $setup = {
    [Item.FeriumOre]: new Formula(Item.FeriumOre, []),
    [Item.OriginiumOre]: new Formula(Item.OriginiumOre, []),
    [Item.AmethystOre]: new Formula(Item.AmethystOre, []),
    [Item.Sandleaf]: new Formula(Item.Sandleaf, []),
    [Item.SandleafPowder]: new Formula(Item.SandleafPowder, [[Item.Sandleaf, 1, 1]]),
    [Item.Buckflower]: new Formula(Item.Buckflower, []),
    [Item.BuckflowerPowder]: new Formula(Item.BuckflowerPowder, [[Item.Buckflower, 1, 1]]),
    [Item.Citrome]: new Formula(Item.Citrome, []),
    [Item.CitromePowder]: new Formula(Item.CitromePowder, [[Item.Citrome, 1, 1]]),

    [Item.HCValleyBattery]: new Formula(
        Item.HCValleyBattery,
        [[Item.SteelPart, 10, 2], 
        [Item.DenseOriginiumPowder, 15, 3]],
        100
    ),
    [Item.SteelPart]: new Formula(Item.SteelPart, [[Item.Steel, 1, 1]]),
    [Item.DenseOriginiumPowder]: new Formula(
        Item.DenseOriginiumPowder,
        [[Item.OriginiumPowder, 2, 2], 
        [Item.SandleafPowder, 1, 1]]
    ),
    [Item.OriginiumPowder]: new Formula(Item.OriginiumPowder, [[Item.OriginiumOre, 1, 1]]),
    [Item.Steel]: new Formula(Item.Steel, [[Item.DenseFeriumPowder, 1, 1]]),
    [Item.DenseFeriumPowder]: new Formula(
        Item.DenseFeriumPowder,
        [[Item.FeriumPowder, 2, 2], 
        [Item.SandleafPowder, 1, 1]]
    ),
    [Item.FeriumPowder]: new Formula(Item.FeriumPowder, [[Item.Ferium, 1, 1]]),
    [Item.Ferium]: new Formula(Item.Ferium, [[Item.FeriumOre, 1, 1]]),

    [Item.CrystonPart]: new Formula(Item.CrystonPart, [[Item.CrystonFiber, 1, 1]]),
    [Item.CrystonFiber]: new Formula(Item.CrystonFiber, [[Item.CrystonPowder, 1, 1]]),
    [Item.CrystonPowder]: new Formula(Item.CrystonPowder, [
        [Item.AmethystPowder, 2, 2],
        [Item.SandleafPowder, 1, 1],
    ]),

    [Item.BuckCapsuleB]: new Formula(
        Item.BuckCapsuleB, [
            [Item.FeriumBottle, 10, 1], 
            [Item.BuckflowerPowder, 10, 1]
        ], 27),
    [Item.FeriumBottle]: new Formula(Item.FeriumBottle, [[Item.Ferium, 2, 2]]),
    [Item.SCValleyBattery]: new Formula(Item.SCValleyBattery, [
        [Item.FeriumPart, 10, 2], 
        [Item.OriginiumPowder, 15, 3]
    ], 30),
    [Item.FeriumPart]: new Formula(Item.FeriumPart, [
        [Item.Ferium, 1, 1]
    ]),
    [Item.LCValleyBattery]: new Formula(Item.LCValleyBattery, [
        [Item.AmethystPart, 5, 1], 
        [Item.OriginiumPowder, 10, 2],
    ], 16),
    [Item.AmethystPart]: new Formula(Item.AmethystPart, [
        [Item.AmethystFiber, 1, 1],
    ], 1),
    [Item.AmethystFiber]: new Formula(Item.AmethystFiber, [
        [Item.AmethystOre, 1, 1],
    ]),
    
    [Item.BuckCapsuleC]: new Formula(Item.BuckCapsuleC, [
        [Item.AmethystBottle, 5, 1],
        [Item.BuckflowerPowder, 5, 1],
    ], 10),

    [Item.CannedCitromeC]: new Formula(Item.CannedCitromeC,[
        [Item.AmethystBottle, 5, 1],
        [Item.CitromePowder, 5, 1],
    ], 10),
    [Item.PackagedOrigocrust]: new Formula(Item.PackagedOrigocrust, [[Item.DenseOrigocrustPowder, 1, 1]], 1),
    [Item.DenseOrigocrustPowder]: new Formula(Item.DenseOrigocrustPowder, [[Item.DenseOriginiumPowder, 1, 1]], 1),
    [Item.CannedCitromeB]: new Formula(Item.CannedCitromeB,[
        [Item.FeriumBottle, 5, 1],
        [Item.CitromePowder, 5, 1],
    ], 10),

    [Item.AmethystBottle]: new Formula(Item.AmethystBottle, 
        [[Item.AmethystFiber, 2, 2]
    ], 2),
    [Item.Origocrust]: new Formula(Item.Origocrust, [[Item.OriginiumOre, 1, 1]], 1),
    [Item.AmethystPowder]: new Formula(Item.AmethystPowder, [[Item.AmethystFiber, 1, 1]], 1),
    [Item.Carbon]: new Formula(Item.Carbon, [[Item.Buckflower, 1, 1]], 1),
    [Item.CrystonBottle]: new Formula(Item.CrystonBottle, [[Item.CrystonFiber, 2, 2]], 1),
    [Item.SteelBottle]: new Formula(Item.SteelBottle, [[Item.Steel, 2, 2]], 1),
    [Item.GroundBuckflowerPowder]: new Formula(Item.GroundBuckflowerPowder, [
        [Item.BuckflowerPowder, 2, 2],
        [Item.SandleafPowder, 1, 1],
    ], 1),
    [Item.BuckCapsuleA]: new Formula(Item.BuckCapsuleA, [
        [Item.SteelBottle, 10, 2],
        [Item.GroundBuckflowerPowder, 10, 2]
    ], 70)
}

$setup satisfies { [K in Item]: Formula<K> };
// export const $setup