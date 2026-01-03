import { InputGroup, InputGroupText } from "reactstrap";

export const StartStopSlider = ({
  start,
  stop,
  min,
  max,
  onChange
}: {
  start: number;
  stop: number;
  min: number;
  max: number;
  onChange: (start: number, stop: number) => void;
}) => {
  const handleStartChange = (value: number) => {
    const newStart = Math.min(value, stop);
    onChange(newStart, stop);
  };

  const handleStopChange = (value: number) => {
    const newStop = Math.max(value, start);
    onChange(start, newStop);
  };

  return (
    <InputGroup style={{ width: '100%' }}>
      <InputGroupText style={{ minWidth: '60px' }}>
        {start}
      </InputGroupText>
      <div style={{ position: 'relative', flex: 1, height: '38px' }}>
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={start}
          onChange={(e) => handleStartChange(parseInt(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          className="range-slider-start"
        />
        <input
          type="range"
          min="0"
          max={max}
          step="1"
          value={stop}
          onChange={(e) => handleStopChange(parseInt(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            background: 'transparent',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          className="range-slider-stop"
        />
        <style>{`
          .range-slider-start,
          .range-slider-stop {
            outline: none;
          }

          .range-slider-start::-webkit-slider-runnable-track,
          .range-slider-stop::-webkit-slider-runnable-track {
            width: 100%;
            height: 8px;
            background: #dee2e6;
            border-radius: 4px;
          }

          .range-slider-start::-moz-range-track,
          .range-slider-stop::-moz-range-track {
            width: 100%;
            height: 8px;
            background: #dee2e6;
            border-radius: 4px;
          }

          .range-slider-start::-webkit-slider-thumb,
          .range-slider-stop::-webkit-slider-thumb {
            pointer-events: auto;
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #007bff;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            margin-top: -6px;
          }

          .range-slider-start::-moz-range-thumb,
          .range-slider-stop::-moz-range-thumb {
            pointer-events: auto;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #007bff;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
          }

          .range-slider-start::-webkit-slider-thumb {
            background: #28a745;
          }

          .range-slider-start::-moz-range-thumb {
            background: #28a745;
          }
        `}</style>
      </div>
      <InputGroupText style={{ minWidth: '60px' }}>
        {stop}
      </InputGroupText>
    </InputGroup>
  );
};
