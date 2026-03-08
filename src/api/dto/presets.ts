import { ID } from "@/pkg/typing/id";
import { IVariables } from "./variables";

export interface IPreset {
    name: ID.PresetName;
    variables: IVariables;
}

// [{"variables":{},"createdAt":1772955944710,"name":"test","updatedAt":1772955944710}]