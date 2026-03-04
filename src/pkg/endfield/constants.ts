export enum Item {
    // Name, // Price
    HCValleyBattery, // 100
    
    BuckCapsuleA,
    BuckCapsuleB, // 27
    SCValleyBattery, // 30
    FeriumComponent,

    LCValleyBattery, // 16
    BuckCapsuleC, // 10
    CannedCitromeC, // 10
    CannedCitromeB, // 10

    SteelPart, // 3
    AmethystBottle, // 2
    Origocrust, // 1
    AmethystPart, // 1 
    FeriumPart, // 1
    Carbon,
    CrystonBottle,
    SteelBottle,

    AmethystFiber,

    FeriumBottle,
    CrystonPart,
    CrystonFiber,
    CrystonPowder,
    PackagedOrigocrust,
    DenseOrigocrustPowder,

    DenseOriginiumPowder,
    DenseFeriumPowder,
    OriginiumPowder,
    AmethystPowder,
    FeriumPowder,

    SandleafPowder,
    BuckflowerPowder,
    CitromePowder,
    GroundBuckflowerPowder,

    Steel,
    
    Ferium,

    OriginiumOre,
    AmethystOre,
    FeriumOre,

    Sandleaf,
    Buckflower,
    Citrome,
}
export type KeyItem = (keyof typeof Item);