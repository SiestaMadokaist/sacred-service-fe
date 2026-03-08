import { IPreset } from "@/api/dto/presets";
import { ID } from "@/pkg/typing/id";
import { useState } from "react";
import { Button, Input, InputGroup } from "reactstrap";
import { usePromptContext } from "./context";

export function PresetManager(): JSX.Element {
  const { promptAPI, variables, setVariables, templateId } = usePromptContext();

  const [presetNames, setPresetNames] = useState<ID.PresetName[]>([]);
  const [selectedName, setSelectedName] = useState<ID.PresetName>('' as ID.PresetName);
  const [saveName, setSaveName] = useState<string>('');
  const [presetVars, setPresetVars] = useState<IPreset['variables']>({});

  const fetchPresets = async () => {
    const { data } = await promptAPI.get<ID.PresetName[]>('/presets');
    setPresetNames(data);
  };

  const selectPreset = async (name: ID.PresetName) => {
    setSelectedName(name);
    if (!name) return;
    const { data } = await promptAPI.get<IPreset>(`/presets/${name}`);
    setPresetVars(data.variables);
  };

  const removeVar = (key: string) => {
    const next = { ...presetVars };
    delete next[key as ID.VariableID];
    setPresetVars(next);
  };

  const applyPreset = () => {
    setVariables({ ...variables, ...presetVars });
  };

  const savePreset = async () => {
    const name = (saveName || templateId || selectedName) as ID.PresetName;
    if (!name) return;
    await promptAPI.post('/presets', { name, variables: presetVars });
  };

  const presetVarEntries = Object.entries(presetVars);

  return (
    <div className="d-flex flex-column gap-2 p-2" style={{ border: '1px solid #444', borderRadius: 6 }}>
      <div className="d-flex gap-2 align-items-center">
        <Input
          type="select"
          bsSize="sm"
          value={selectedName}
          onChange={(e) => selectPreset(e.target.value as ID.PresetName)}
          style={{ maxWidth: 180 }}
        >
          <option value="">-- select preset --</option>
          {presetNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Input>
        <Button size="sm" color="secondary" onClick={fetchPresets} title="Refresh presets">
          ↺
        </Button>
        <Button size="sm" color="success" onClick={applyPreset} disabled={presetVarEntries.length === 0}>
          Apply
        </Button>
      </div>

      {presetVarEntries.length > 0 && (
        <div className="d-flex flex-column gap-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
          {presetVarEntries.map(([key, val]) => (
            <div key={key} className="d-flex gap-1 align-items-center">
              <Button
                size="sm"
                color="danger"
                onClick={() => removeVar(key)}
                style={{ padding: '0 6px', lineHeight: '1.2' }}
              >
                ✕
              </Button>
              <span style={{ minWidth: 100, color: '#aaa', fontSize: 12 }}>{key}</span>
              <span style={{ fontSize: 12 }}>{val}</span>
            </div>
          ))}
        </div>
      )}

      <InputGroup size="sm">
        <Input
          placeholder={templateId || selectedName || 'preset name'}
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
        />
        <Button color="primary" onClick={savePreset}>
          Save
        </Button>
      </InputGroup>
    </div>
  );
}
