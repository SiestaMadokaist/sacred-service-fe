type Strict<X> = { __branded: X, __ctx: "ID"} ;
type Loose<X> = { __branded?: X, __ctx?: 'ID' };
type SS<X> = string & Strict<X>;
type S<X> = string & Loose<X>;
export namespace ID {
    export type PresetName = S<'preset.name'>;
    export type VariableID = S<'var.id'>;
    export type VariableValue = S<'var.value'>;
}