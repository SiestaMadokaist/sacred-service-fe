"use client";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import useLocalStorage from "use-local-storage";
import OpenAI from "openai";
import { useDebounce } from "use-debounce";

const customParameters = {
  "temperature": "number (0-2) 0.7 is a good default, 0 is deterministic, 2 is very creative",
  "top_p": "number (0-1), alternative to sampling with temperature",
  "n": "number (number of responses)",
  "stream": "boolean",
  "max_tokens": "number (alias: max_output_tokens)",
  "max_output_tokens": "number",
  "tool_choice": "auto | none | {\"type\": \"function\", \"function\": {\"name\": \"string\"}}",
  "parallel_tool_calls": "boolean",
}


const OllamaPage: React.FC = () => {
  const [openAIKey, setOpenAIKey] = useLocalStorage("openai_api", "");
  const [selectedModel, setSelectedModel] = useLocalStorage("openai_model", "gpt-4o-mini");
  const [systemPrompt, setSystemPrompt] = useLocalStorage("openai_system_prompt", "");
  const [userPrompt, setUserPrompt] = useLocalStorage("openai_user_prompt", "");
  const [customParamsText, setCustomParamsText] = useLocalStorage("openai_custom_params", JSON.stringify(customParameters, null, 2));
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [client, setClient] = useState<OpenAI | null>(null);
  const [jsonError, setJsonError] = useState<string>("");
  const [parsedParams, setParsedParams] = useState<Record<string, any>>({});
  const [debouncedParamsText] = useDebounce(customParamsText, 500);

  useEffect(() => {
    try {
      const parsed = JSON.parse(debouncedParamsText);
      setParsedParams(parsed);
      setJsonError("");
    } catch (err: any) {
      setJsonError(err.message);
      setParsedParams({});
    }
  }, [debouncedParamsText]);

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

  const resetCustomParams = () => {
    setCustomParamsText(JSON.stringify(customParameters, null, 2));
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
        ...parsedParams
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

            <FormGroup>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Label for="customParams" className="text-light fw-bold mb-0">Custom Parameters (JSON)</Label>
                <Button size="sm" color="secondary" onClick={resetCustomParams}>
                  Reset
                </Button>
              </div>
              <Input
                type="textarea"
                id="customParams"
                rows={4}
                placeholder="Enter custom parameters as JSON"
                value={customParamsText}
                onChange={(e) => setCustomParamsText(e.target.value)}
                style={{
                  backgroundColor: jsonError ? "#6b1f1f" : undefined,
                  color: jsonError ? "#f8d1d1" : undefined
                }}
              />
              {jsonError && (
                <small className="text-danger">Invalid JSON: {jsonError}</small>
              )}
            </FormGroup>

            <Button style={{ width: '100%' }} color="primary" type="submit" disabled={loading || !!jsonError}>
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
