"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Table,
  Spinner,
  Container,
  Row,
  Col,
  Alert,
  InputGroup,
  InputGroupText,
} from "reactstrap";
import { apiHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { useToast } from "../../../hooks/useToast";
import { EC2Instance } from "../../../api/computes/samples";
import { CheckpointSelector } from "./select-checkpoint";
import { CheckpointDownloader, CheckpointUpdater } from "./checkpoint-fetcher";
import { useTitle } from "../../../hooks/useTitle";
import { LoraManager } from "../../../components/LoraManager";

interface ICheckpoint {
  region: string;
  bucket: string;
  key: string;
  minSize: number;
}

interface IBill {
  Estimated: boolean;
  Groups: [];
  TimePeriod: { Start: string; End: string };
  Total: {
    UnblendedCost: { Amount: string; Unit: string };
  }
}

interface INamedRegion {
  name: string;
  id: string;
}

const regions: INamedRegion[] = [{
  name: 'sydney',
  id: 'ap-southeast-2',
}, {
  name: 'virginia',
  id: 'us-east-1',
}]

const ComputeManager: React.FC = () => {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [checkpoints, setCheckpoints] = useState<ICheckpoint[]>([]);
  const [checkpoint, setCheckpoint] = useState<ICheckpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<INamedRegion>(regions[0]);

  const { toastElement, showToast } = useToast({ duration: 3000 });
  const [hub] = useState(apiHub);
  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ level: 'danger', show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
    // hub.on('api-success', (msg) => {
    //   showToast({ level: 'success', show: true, title: `Success`, message: msg.message });
    // })
  })

  const computeAPI = useApi(hub, `/computes/${region.id}`);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const { data } = await computeAPI.get<EC2Instance[]>("/");
      setInstances(data);
      setError(null);
      const { data: checkpoints } = await computeAPI.get<ICheckpoint[]>("/sd-models/checkpoints");
      setCheckpoints(checkpoints);
      setCheckpoint(checkpoints[0]);
    } catch (err) {
      setError("Failed to fetch instances.");
    }
    setLoading(false);
  };

  const [force, setForce] = useState(false);

  const triggerAction = async (instanceId: string, action: string) => {
    try {
      await computeAPI.post(`/${instanceId}/${action}`, { instanceId, force });
      await fetchInstances();
    } catch {
      setError(`Failed to ${action} instance ${instanceId}`);
    }
  };

  const launchNewInstance = async () => {
    try {
      const params = {
        checkpoint,
        ts: Date.now(),
      }
      const ans = confirm(`Starting instance with key: ${checkpoint?.key}`);
      if (!ans) { return; }
      await computeAPI.post("/", params);
      await fetchInstances();
      const instanceId = instances[0].InstanceId;
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      await computeAPI.post(`/${instanceId}/reboot`);
    } catch {
      setError("Failed to launch a new instance.");
    }
  };


  const [dailyBills, setDailyBills] = useState<IBill[]>([]);

  const fetchBill = async () => {
    const resp = await computeAPI.get("/bill");
    setDailyBills(resp.data);
  }

  useEffect(() => {
    fetchInstances();
    fetchBill();
  }, [region]);

  useTitle("🖥️ Server Manager");
  const date = new Date();
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  const daysPassedInMonth = date.getDate();
  const billMTD: number = (() => {
    const amounts = dailyBills
      .map((x) => x.Total.UnblendedCost.Amount)
      .map((x) => parseFloat(x))
    return amounts.reduce((acc, val) => acc + val, 0);
  })();
  const monthlyEstimate = billMTD * (daysInMonth / daysPassedInMonth);

  return (
    <Container className="mt-5">
      <Row className="mb-3 justify-content-between align-items-center">
        <Col>
          <h2 style={{ "color": "#66CCFF " }}>Sacred Secret Service</h2>
          <h2 style={{ "color": "#66CCFF " }}>
            {billMTD.toFixed(3)} USD / {monthlyEstimate.toFixed(3)} USD
          </h2>
        </Col>
        <Col className="d-flex gap-2">
          {regions.map((r) => (
            <Button
              key={r.id}
              size="sm"
              color={region.id === r.id ? "primary" : "secondary"}
              onClick={() => setRegion(r)}
            >
              {r.name} ({r.id})
            </Button>
          ))}
        </Col>
      </Row>
      <div style={{ borderBottom: '1px #146c43 dotted' }} className="d-flex mb-2">
        {dailyBills.map((x) => (<Col key={x.TimePeriod.Start}>
          <div className="color-white">
            {parseFloat(x.Total.UnblendedCost.Amount).toFixed(2)}
          </div>
        </Col>))}
      </div>
      {error && (
        <Row>
          <Col>
            <Alert color="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {loading ? (
        <Row>
          <Col className="text-center">
            <Spinner color="primary" />
          </Col>
        </Row>
      ) : (
        <>
            {true && (
              <Row className="d-flex align-items-center justify-content-between" >
              <Col>
                <Button color="success" onClick={launchNewInstance}>
                  Launch New Instance
                </Button>
              </Col>
                <Col>
                  <CheckpointSelector
                    checkpoints={checkpoints}
                    selectedCheckpoint={checkpoint}
                    onSelect={(cp) => setCheckpoint(cp)}
                  />
                </Col>
              </Row>
            )}
          {instances.length > 0 && (
            <Table striped responsive>
              <thead>
                <tr>
                  <th>Instance ID</th>
                  <th>State</th>
                  <th>Type</th>
                  <th>Launch Time</th>
                    <th onClick={() => setForce(!force)} className="d-flex flex-row" style={{ cursor: "pointer", color: force ? '#dc3545' : 'black' }}>
                      <div>Actions:</div>
                      <div className="ml-2">{force ? 'Immediate' : 'Queued'}</div>
                      <div className="ml-4"><s>{force ? 'Queued' : 'Immediate'}</s></div>
                    </th>
                </tr>
              </thead>
              <tbody>
                {instances.map((inst) => (
                  <tr key={inst.InstanceId}>
                    <td>{inst.InstanceId}</td>
                    <td>{inst.State.Name}</td>
                    <td>{inst.InstanceType}</td>
                    <td>{inst.LaunchTime ?? "-"}</td>
                    <td>
                      <Button
                        size="sm"
                        color="primary"
                        className="me-1"
                        onClick={() =>
                          triggerAction(inst.InstanceId, "start")
                        }
                        disabled={inst.State.Name !== "stopped"}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        color="warning"
                        className="me-1"
                        onClick={() =>
                          triggerAction(inst.InstanceId, "stop")
                        }
                        disabled={inst.State.Name !== "running"}
                      >
                        Stop
                      </Button>
                      <Button
                        size="sm"
                        color="info"
                        className="me-1"
                        onClick={() =>
                          triggerAction(inst.InstanceId, "reboot")
                        }
                        disabled={inst.State.Name !== "running"}
                      >
                        Reboot
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        onClick={() =>
                          triggerAction(inst.InstanceId, "terminate")
                        }
                      >
                        Terminate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}
      <div className="d-flex flex-row w-100">
        <div className="w-45">
          <CheckpointDownloader api={computeAPI} />
          <CheckpointUpdater
            checkpoints={checkpoints}
            api={computeAPI}
          />
        </div>
        <div className="w-45 ml-10">
          <LoraManager computeAPI={computeAPI} />
        </div>
      </div>
      {toastElement}
    </Container>
  );
};

export default ComputeManager;
