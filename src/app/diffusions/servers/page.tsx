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
} from "reactstrap";
import { apiHub } from "../../../api/hub";
import { useApi } from "../../../hooks/useApi";
import { useToast } from "../../../hooks/useToast";
import { EC2Instance } from "../../../api/computes/samples";
import { CheckpointSelector } from "./select-checkpoint";
import { CheckpointDownloader, CheckpointUpdater } from "./checkpoint-fetcher";

interface ICheckpoint {
  region: string;
  bucket: string;
  key: string;
  minSize: number;
}

const ComputeManager: React.FC = () => {
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [checkpoints, setCheckpoints] = useState<ICheckpoint[]>([]);
  const [checkpoint, setCheckpoint] = useState<ICheckpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toastElement, showToast } = useToast({ duration: 3000 });
  const hub = apiHub();
  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ level: 'danger', show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
    hub.on('api-success', (msg) => {
      showToast({ level: 'success', show: true, title: `Success`, message: msg.message });
    })
  })

  const computeAPI = useApi(hub, "/computes");

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

  const triggerAction = async (instanceId: string, action: string) => {
    try {
      await computeAPI.post(`/${instanceId}/${action}`, { instanceId });
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

  useEffect(() => {
    fetchInstances();
  }, []);

  return (
    <Container className="mt-5">
      <Row className="mb-3">
        <Col>
          <h2 style={{ "color": "#66CCFF " }}>EC2 Instance Manager</h2>
        </Col>
      </Row>

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
            {instances.filter((x) => x.State.Name === 'running').length === 0 && (
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
                  <th>Actions</th>
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
      <CheckpointDownloader api={computeAPI} />
      <CheckpointUpdater
        checkpoints={checkpoints}
        api={computeAPI}
      />
      {toastElement}
    </Container>
  );
};

export default ComputeManager;
