"use client";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import useLocalStorage from "use-local-storage";
import OpenAI from "openai";

const OllamaPage: React.FC = () => {
  const [openAIKey, setOpenAIKey] = useLocalStorage("openai_api", "");
  const [selectedModel, setSelectedModel] = useLocalStorage("openai_model", "gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useLocalStorage("openai_system_prompt", "");
  const [userPrompt, setUserPrompt] = useLocalStorage("openai_user_prompt", "");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [client, setClient] = useState<OpenAI | null>(null);

  useEffect(() => {
    if (!openAIKey) {
      setClient(null);
      return;
    }

    const newClient = new OpenAI({
      apiKey: openAIKey,
      dangerouslyAllowBrowser: true
    });
    setClient(newClient);

    const fetchModels = async () => {
      try {
        const models = await newClient.models.list();
        const modelIds = models.data.map((model) => model.id).sort();
        setAvailableModels(modelIds);
      } catch (err) {
        console.error("Failed to fetch models:", err);
      }
    };

    fetchModels();
  }, [openAIKey]);

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
    if (loading || !client) return;

    setLoading(true);
    setError("");
    setResponse("");
    setDuration(null);

    const startTime = performance.now();

    try {
      const completion = await client.chat.completions.create({
        model: selectedModel,
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
        temperature: 0.7,
        // max_tokens: 1000
      });
      const endTime = performance.now();
      setDuration(endTime - startTime);
      setResponse(completion.choices[0]?.message?.content || "No response");
    } catch (err: any) {
      const endTime = performance.now();
      setDuration(endTime - startTime);
      setError(err.message || "Failed to connect to OpenAI");
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
          <h2 className="mb-4 text-light">OpenAI Chat</h2>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label for="openAIKey" className="text-light fw-bold">OpenAI API Key</Label>
              <Input
                type="password"
                id="openAIKey"
                placeholder="Enter your OpenAI API key (saved to localStorage)"
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
              />
            </FormGroup>

            <FormGroup>
              <Label for="modelSelect" className="text-light fw-bold">Model</Label>
              <Input
                type="select"
                id="modelSelect"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={availableModels.length === 0}
              >
                {availableModels.length === 0 ? (
                  <option>Loading models...</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </Input>
            </FormGroup>

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
