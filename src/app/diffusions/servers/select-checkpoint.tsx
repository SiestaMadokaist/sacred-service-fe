import React from 'react';
import {
  FormGroup,
  Label,
  Input,
} from 'reactstrap';
import { CheckpointSelectorProps } from './interface';

export const CheckpointSelector: React.FC<CheckpointSelectorProps> = ({
  checkpoints,
  selectedCheckpoint,
  onSelect,
}) => {
  return (
    <FormGroup>
      <Label style={{ color: "#66CCFF" }} for="checkpointSelect">Select Checkpoint</Label>
      <Input
        type="select"
        name="checkpointSelect"
        id="checkpointSelect"
        value={selectedCheckpoint?.key || ''}
        onChange={(e) => {
          const selected = checkpoints.find(cp => cp.key === e.target.value);
          if (selected) onSelect(selected);
        }}
      >
        <option value="" disabled>Select a checkpoint</option>
        {checkpoints.map((cp) => (
          <option key={cp.key} value={cp.key}>
            {cp.key} ({(cp.minSize / (1024 * 1024 * 1024)).toFixed(3)} GB)
          </option>
        ))}
      </Input>
    </FormGroup>
  );
};
