import { ID } from "@/pkg/typing/id";
import { IVariables } from "./variables";

export interface IPreset {
    name: ID.PresetName;
    variables: IVariables;
}

