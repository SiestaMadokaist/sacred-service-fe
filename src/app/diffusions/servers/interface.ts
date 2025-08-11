export interface ICheckpoint {
  region: string;
  bucket: string;
  key: string;
  minSize: number;
}

export interface CheckpointSelectorProps {
  checkpoints: ICheckpoint[];
  selectedCheckpoint: ICheckpoint | null;
  onSelect: (checkpoint: ICheckpoint) => void;
}
