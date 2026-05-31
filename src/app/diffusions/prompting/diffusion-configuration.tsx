import { SAMPLING_METHODS, SAMPLING_SCHEDULES, usePromptContext } from "./context";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { StartStopSlider } from "../../../components/start-stop-slider";
import useLocalStorage from "use-local-storage";

export const DiffusionConfiguration = (): JSX.Element => {
  const ctx = usePromptContext();
  const { templates } = ctx;

  const randSeed = () => {
    ctx.setSeed(Math.floor(Math.random() * 999999999));
  };

  const [startStop, setStartStop] = useLocalStorage<[number, number]>('diffusion.startstop', [1, templates.length]);
  const [start, stop] = startStop;
  return (
    <div>
      <div className="w-100 d-flex flex-wrap mt-3 gap-2">
        <InputGroup style={{ width: '99%' }}>
          <InputGroupText onClick={randSeed} style={{ cursor: 'pointer' }}>Seed:</InputGroupText>
          <Input min="-1" max="999999999" type="number" placeholder="Seed" value={ctx.seed} onChange={(e) => ctx.setSeed(parseInt(e.target.value))} />
          <InputGroupText>Repeat:</InputGroupText>
          <Input min="1" max="5" type="number" placeholder="nIter" value={ctx.nIter} onChange={(e) => ctx.setNIter(parseInt(e.target.value))} />
          <InputGroupText>Step:</InputGroupText>
          <Input min="1" max="100" type="number" placeholder="Step Count" value={ctx.stepCount} onChange={(e) => ctx.setStepCount(parseInt(e.target.value))} />
        </InputGroup>
      </div>
      <div className="w-100 d-flex flex-wrap mt-2 gap-2">
        <InputGroup style={{ width: '24%' }}>
          <InputGroupText>Subseed:</InputGroupText>
          <Input min="0" max="1" step="0.05" type="number" value={ctx.subseedStrength} onChange={(e) => ctx.setSubseedStrength(parseFloat(e.target.value))} />
        </InputGroup>
        <InputGroup style={{ width: '24%' }}>
          <InputGroupText>Method:</InputGroupText>
          <Input type="select" value={ctx.samplingMethod} onChange={(e) => ctx.setSamplingMethod(e.target.value as any)}>
            {SAMPLING_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </Input>
        </InputGroup>
        <InputGroup style={{ width: '49%' }}>
          <InputGroupText>Schedule:</InputGroupText>
          <Input type="select" value={ctx.samplingSchedule} onChange={(e) => ctx.setSamplingSchedule(e.target.value as any)}>
            {SAMPLING_SCHEDULES.map((schedule) => (
              <option key={schedule} value={schedule}>{schedule}</option>
            ))}
          </Input>
        </InputGroup>
      </div>
      <div className="w-100 d-flex flex-wrap mt-2 gap-2">
        <div className="w-80">
          <StartStopSlider
            start={startStop[0]}
            stop={startStop[1]}
            min={1}
            max={templates.length}
            onChange={(start, stop) => setStartStop([start, stop])}
          />
        </div>
        <div className="w-18">
          <Button onClick={() => ctx.pushQueue(ctx.templates.slice(start - 1, stop).flatMap((t) => [...new Array(t.taskRepeat ?? 1)].map(() => t)))} color="warning" style={{ width: '100%' }}>Queue</Button>
        </div>
      </div>
    </div>
  );
};
