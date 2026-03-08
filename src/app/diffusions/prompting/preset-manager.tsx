import { IPreset } from "@/api/dto/presets";
import { ID } from "@/pkg/typing/id";
import { useEffect, useState } from "react";
import { Button, Input, InputGroup, Modal, ModalBody, ModalHeader } from "reactstrap";
import { usePromptContext } from "./context";

export function PresetManagerModal({ isOpen, toggle }: { isOpen: boolean; toggle: () => void }): JSX.Element {
  const { promptAPI, variables, setVariables, templateId } = usePromptContext();

  const [presetNames, setPresetNames] = useState<ID.PresetName[]>([]);
  const [selectedName, setSelectedName] = useState<ID.PresetName>('' as ID.PresetName);
  const [saveName, setSaveName] = useState<string>('');
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [presetVars, setPresetVars] = useState<IPreset['variables']>({});
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const toggleReject = (key: string) => {
    setRejected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const activeVars = () => Object.fromEntries(
    Object.entries(presetVars).filter(([k]) => !rejected.has(k))
  ) as IPreset['variables'];

  const fetchPresets = async () => {
    const { data } = await promptAPI.get<IPreset[]>('/presets/');
    setPresetNames(data.map((p) => p.name));
  };

  useEffect(() => { fetchPresets(); }, []);

  useEffect(() => {
    if (isOpen) {
      setPresetVars({ ...variables });
      setRejected(new Set(Object.keys(variables)));
    }
  }, [isOpen]);

  const selectPreset = async (name: ID.PresetName) => {
    setSelectedName(name);
    setSaveName(name);
    if (!name) return;
    const { data } = await promptAPI.get<IPreset>(`/presets/${name}`);
    setPresetVars(data.variables);
    setRejected(new Set());
  };

  const applyPreset = () => {
    setVariables({ ...variables, ...activeVars() });
  };

  const savePreset = async () => {
    if (!selectedName) return;
    await promptAPI.post('/presets/', { name: selectedName, variables: activeVars() });
  };

  const deletePreset = async () => {
    if (!selectedName) return;
    const ok = confirm(`You're about to delete "${selectedName}". Press OK to continue.`);
    if (!ok) return;
    await promptAPI.delete(`/presets/${selectedName}`);
    setSelectedName('' as ID.PresetName);
    setSaveName('');
    setPresetVars({});
    await fetchPresets();
  };

  const saveAsPreset = async () => {
    if (!saveAsMode) { setSaveAsMode(true); return; }
    const name = (saveName || templateId) as ID.PresetName;
    if (!name) return;
    await promptAPI.post('/presets/', { name, variables: activeVars() });
    setSaveAsMode(false);
  };

  const presetVarEntries = Object.entries(presetVars).sort(([a], [b]) => {
    return (rejected.has(a) ? 1 : 0) - (rejected.has(b) ? 1 : 0);
  });

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        <div className="d-flex gap-2 align-items-center">
          <span>Preset Manager</span>
          <Button size="sm" color="secondary" onClick={fetchPresets} title="Refresh">↺</Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="d-flex flex-column gap-2">
          <div className="d-flex gap-2 align-items-center">
            <Input
              type="select"
              value={selectedName}
              onChange={(e) => selectPreset(e.target.value as ID.PresetName)}
              style={{ maxWidth: 220 }}
            >
              <option value="">-- select preset --</option>
              {presetNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Input>
            <Button color="success" onClick={applyPreset} disabled={presetVarEntries.length === 0}>Apply</Button>
            <Button color="danger" onClick={deletePreset} disabled={!selectedName}>Delete</Button>
            <Button color="primary" onClick={savePreset} disabled={!selectedName}>Save</Button>
            <InputGroup>
              <Button color="warning" onClick={saveAsPreset}>{saveAsMode ? 'Confirm' : 'Save As'}</Button>
              <Input
                placeholder={templateId || 'new preset name'}
                value={saveName}
                disabled={!saveAsMode}
                onChange={(e) => setSaveName(e.target.value)}
              />
            </InputGroup>
          </div>

          {presetVarEntries.length > 0 && (
            <div className="d-flex flex-column gap-1" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {presetVarEntries.map(([key, val]) => (
                <div key={key} className="d-flex gap-1 align-items-center" style={{ opacity: rejected.has(key) ? 0.4 : 1 }}>
                  <Button
                    color={rejected.has(key) ? 'secondary' : 'danger'}
                    onClick={() => toggleReject(key)}
                    style={{ padding: '0 8px', lineHeight: '1.2' }}
                  >
                    ✕
                  </Button>
                  <span style={{ minWidth: 120, color: '#aaa', fontSize: 14, textDecoration: rejected.has(key) ? 'line-through' : 'none' }}>{key}</span>
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setPresetVars({ ...presetVars, [key as ID.VariableID]: e.currentTarget.textContent as ID.VariableValue })}
                    style={{ fontSize: 14, minWidth: 80, outline: 'none', borderBottom: '1px solid #555', cursor: 'text' }}
                  >{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}
