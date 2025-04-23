"use client";
import { useEffect, useState } from "react"
import { apiHub, initShowHub, ShowHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { IconTrash } from "@tabler/icons-react";
import { useDebounce } from "use-debounce";
import { AxiosInstance } from "axios";
import { useToast } from "../../../hooks/useToast";
import { SYSTEM_ENV } from "../../../helper/env";
import { Showcase } from "../../../components/showcase";
import { EventEmitter } from "stream";

export interface ITask {
  jobId: string;
  priorityScore: number;
  actionType: 'generate' | 'fetch';
  currentStatus: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';
  resourceCount: number;
  actionId?: string;
  progressCount?: number;
}

export interface IQueueElement {
  task: ITask;
  promptAPI: AxiosInstance;
  renew: () => void;
}

const QueueElement = (props: IQueueElement) : JSX.Element => {
  const { task, promptAPI} = props;
  const callDelete = async () => {
    await promptAPI.delete(`/queue/${task.jobId}`);
    props.renew();
  }

  const callRepriority = async () => {
    await promptAPI.put(`/queue/${task.jobId}`, { priorityScore: task.priorityScore });
    props.renew();
  }

  const [priorityScore, setPriorityScore] = useState(task.priorityScore);
  const [dPrioScore] = useDebounce(priorityScore, 3000);

  useEffect(() => {
    if (dPrioScore !== task.priorityScore) {
      callRepriority();
    }
  }, [dPrioScore]);

  useEffect(() => {
    setPriorityScore(task.priorityScore);
  }, [task.priorityScore])

  const statusColor = () => {
    if (task.currentStatus === 'pending') {
      return 'darkorange';
    }
    if (task.currentStatus === 'running') {
      return '#2196f3'; // blueish
    }
    return 'gray';
  }

  const progressed = () => {
    if (task.progressCount === undefined || task.resourceCount === undefined) { return 0 }
    if (task.resourceCount === 0) { return 0 }
    return Math.floor((task.progressCount / task.resourceCount) * 100);
  }
  const unprocessed = 100 - progressed();
  const bgText = `linear-gradient(to right, #4caf50 0 ${progressed()}%, white 0%)`;
  console.log({ progressed: progressed(), unprocessed, bgText });
  return (<div className="w-100 d-flex flex-row mt-2">
    <InputGroup className="w-85">
      <InputGroupText>#</InputGroupText>
      <Input style={{ color: 'wheat', backgroundColor: 'darkmagenta'}} type="number" className="w-5" value={priorityScore} onChange={(v) => setPriorityScore(parseInt(v.target.value))}/>
      <InputGroupText className="w-20">Action Type: {task.actionType}</InputGroupText>
      <InputGroupText className="w-5">({task.progressCount ?? 0}/{task.resourceCount ?? 0})</InputGroupText>
      <InputGroupText style={{
        background: bgText,
      }} className="w-40">{task.actionId}</InputGroupText>
      <InputGroupText style={{ backgroundColor: statusColor() }} className="w-20">
        Status: {task.currentStatus}
      </InputGroupText>
    </InputGroup>
    <Button className="w-10 ml-1" color="danger" onClick={callDelete}>
      <IconTrash className="bg-transparent" size={16} />
    </Button>
  </div>)
}

export default function QueuePage(): JSX.Element {
  const [hub] = useState(apiHub());
  const promptAPI = useApi(hub, '/prompts');
  const collectionAPI = useApi(hub, '/collections');
  const [queueData, setQueue] = useState<ITask[]>([]);
  const fetchQueue = async () => {
    if (document?.visibilityState === 'hidden') { return }
    const resp = await promptAPI.get('/queue');
    const data = resp.data as ITask[];
    setQueue(data);
  }
  const { toastElement, showToast } = useToast({ duration: 3000 });

  useEffect(() => {
    hub.on('api-error', (err: any) => {
      showToast({ title: 'API Error', message: err.message, level: 'danger', show: true });
    })
    hub.on('api-success', (msg: any) => {
      showToast({ title: 'API Success', message: msg.message, level: 'success', show: true });
    })
  }, []);

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchQueue();
  }, [lastUpdated])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  const onRenew = fetchQueue;

  const [showHub, _] = useState<ShowHub>(initShowHub());
  return (
    <div className="w-100 h-100vh d-flex flex-wrap justify-content-center">
      <Showcase collectionAPI={collectionAPI} hub={showHub} fetchInterval={10_000} duration={10_000} refURL={`${SYSTEM_ENV.IMAGE_PREFIX}/public/latest.json`} />
      {toastElement}
      <div className="w-90 color-white mt-2 d-flex flex-row justify-content-center align-items-center">
        <h4>Queue Manager</h4>
      </div>
      <div className="w-90">
        {queueData.map((x, i) => (<QueueElement renew={onRenew} promptAPI={promptAPI} key={`queue-${i}`} task={x} />))}
      </div>
    </div>
  )
}
