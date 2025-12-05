"use client";
import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import axios from "axios";
import useLocalStorage from "use-local-storage";

const OllamaPage: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useLocalStorage("ollama_system_prompt", "");
  const [userPrompt, setUserPrompt] = useLocalStorage("ollama_user_prompt", "");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setResponse("");
    setDuration(null);

    const startTime = performance.now();

    try {
      const payload = {
        model: "qwen3:8b",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        stream: false
      };

      const result = await axios.post("http://localhost:11434/api/chat", payload);
      const endTime = performance.now();
      setDuration(endTime - startTime);
      setResponse(result.data.message?.content || JSON.stringify(result.data));
    } catch (err: any) {
      const endTime = performance.now();
      setDuration(endTime - startTime);
      setError(err.message || "Failed to connect to Ollama");
    } finally {
      setLoading(false);
    }
  };

  const handleUserPromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col md={6}>
          <h2 className="mb-4 text-light">Ollama Chat</h2>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label for="systemPrompt" className="text-light fw-bold">System Prompt</Label>
              <Input
                type="textarea"
                id="systemPrompt"
                rows={6}
                placeholder="Enter system prompt (saved to localStorage)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label for="userPrompt" className="text-light fw-bold">User Prompt</Label>
              <Input
                type="textarea"
                id="userPrompt"
                rows={6}
                placeholder="Enter user prompt (saved to localStorage)"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                onKeyDown={handleUserPromptKeyDown}
              />
            </FormGroup>

            <Button style={{ width: '100%' }} color="primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Form>
        </Col>
        <Col md={6}>
          <h3 className="mb-3 text-light">Response</h3>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              {response && (
                <Button
                  color={copied ? "success" : "secondary"}
                  onClick={handleCopyResponse}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </div>
            {duration !== null && (
              <div className="text-light">
                <small>Duration: {(duration / 1000).toFixed(2)}s ({duration.toFixed(0)}ms)</small>
              </div>
            )}
          </div>
          {error && (
            <Alert color="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}
          {response && (
            <div className="p-3 border rounded bg-light">
              <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {response}
              </pre>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OllamaPage;
