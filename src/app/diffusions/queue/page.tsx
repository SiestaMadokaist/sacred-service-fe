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
import { IReport, Showcase } from "../../../components/showcase";
import { EventEmitter } from "stream";
import { useTitle } from "../../../hooks/useTitle";

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
  const { task, promptAPI } = props;
  const callDelete = async () => {
    await promptAPI.delete(`/queue`, { data: { jobId: task.jobId }});
    props.renew();
  }

  const [priorityScore, setPriorityScore] = useState(task.priorityScore);
  const [dPrioScore] = useDebounce(priorityScore, 3000);

  const callRepriority = async () => {
    await promptAPI.put(`/queue`, { jobId: task.jobId, priorityScore });
    props.renew();
  }

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

  const bgText = `linear-gradient(to right, #4caf50 0 ${progressed()}%, white 0%)`;
  useTitle("🕒 Queue Page");
  return (<div className="w-100 d-flex flex-row mt-2">
    <InputGroup className="w-100">
      <Input style={{ color: 'wheat', backgroundColor: 'darkmagenta' }} type="number" value={priorityScore} onChange={(v) => setPriorityScore(parseInt(v.target.value))} />
      <InputGroupText >{task.actionType}</InputGroupText>
      <InputGroupText >({task.progressCount ?? 0}/{task.resourceCount ?? 0})</InputGroupText>
      <InputGroupText style={{
        background: bgText,
      }} >{task.actionId}</InputGroupText>
      <InputGroupText style={{ backgroundColor: statusColor() }} className="w-20">
        {task.currentStatus}
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
    window.addEventListener('visibilitychange', () => {
      if (document?.visibilityState === 'visible') {
        setLastUpdated(new Date());
      }
    })
  }, [])
  const [report, setReport] = useState<IReport>({
    createdAt: 0,
    url: '',
    prompts: '',
    negatives: '',
    loras: '',
    checkpoint: ''
  });

  const onViewChanged = (report: IReport) => {
    setReport(report);
  }
  return (
    <div className="w-100 h-100vh d-flex flex-wrap justify-content-center">
      {toastElement}
      <div className="w-90 color-white mt-2 d-flex flex-row justify-content-center align-items-center">
        <h4>Queue Manager</h4>
      </div>
      <div className="w-50">
        <div className="w-90 ml-5">
          <div className="w-100 d-flex flex-column mt-2" style={{ height: '30vh', overflowY: 'auto' }}>
            <pre style={{ color: 'wheat', whiteSpace: 'pre-wrap', margin: 0, minHeight: '1.2rem' }}>{report.checkpoint}</pre>
            <hr style={{ borderColor: 'gray', margin: '4px 0' }} />
            <pre style={{ color: 'white', whiteSpace: 'pre-wrap', margin: 0 }}>{report.prompts}</pre>
          </div>

          {queueData.map((x, i) => (<QueueElement renew={fetchQueue} promptAPI={promptAPI} key={`queue-${i}`} task={x} />))}
        </div>
      </div>
      <div className="w-50" style={{ maxHeight: '90vh', overflowY: 'auto', zIndex: 6 }}>
        <Showcase onViewChanged={onViewChanged} collectionAPI={collectionAPI} onReport={() => setLastUpdated(new Date())} />
      </div>
    </div>
  )
}
