"use client";
import React, { useEffect, useState } from "react";
import { Container, Form, FormGroup, Label, Input, Button, Alert, Toast, ToastBody, ToastHeader } from "reactstrap";
import { useToast } from "../hooks/useToast";
import { useLoginAPI } from "../hooks/useApi";
import { useMetaMask } from "../hooks/useMetaMask";
import { apiHub } from "../api/hub";
import { IAuth, setAuth } from "../api/api";

const divDisplay = (condition: boolean, show: string, hide: string) => ({ display: condition ? show : hide });

const LoginModal: React.FC<{
  onSubmit: (e: React.FormEvent) => Promise<void>;
  setUsername: (val: string) => void;
  setPassword: (val: string) => void;
  username: string;
  password: string;
  error: string;
  toggle: () => void;
  onMetaMaskLogin: () => Promise<void>;
  isMetaMaskInstalled: boolean;
  isMetaMaskConnecting: boolean;
  metamaskError: string | null;
}> = ({ onSubmit, setUsername, setPassword, username, password, error, toggle, onMetaMaskLogin, isMetaMaskInstalled, isMetaMaskConnecting, metamaskError }) => (
  <div className="w-50 p-4 border rounded shadow-sm bg-light">
    <h2 className="text-center mb-4">Login</h2>
    <Form onSubmit={onSubmit}>
      <Alert color="danger" style={divDisplay(!!error, "block", "none")}>{error}</Alert>
      <FormGroup>
        <Label for="username">Username</Label>
        <Input type="text" id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label for="password">Password</Label>
        <Input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormGroup>
      <Button color="primary" block type="submit">Login</Button>
    </Form>
    <div className="text-center my-3">
      <span className="text-muted">or</span>
    </div>
    {metamaskError && <Alert color="danger">{metamaskError}</Alert>}
    {isMetaMaskInstalled ? (
      <Button
        color="warning"
        block
        onClick={onMetaMaskLogin}
        disabled={isMetaMaskConnecting}
      >
        {isMetaMaskConnecting ? 'Connecting...' : 'Login with MetaMask'}
      </Button>
    ) : (
      <Button
        color="secondary"
        block
        disabled
        title="Please install MetaMask browser extension"
      >
        MetaMask Not Installed
      </Button>
    )}
    <Button color="link" block onClick={toggle}>Need an account? Register</Button>
  </div>
);

const RegisterModal: React.FC<{ onSubmit: (e: React.FormEvent) => Promise<void>; setUsername: (val: string) => void; setPassword: (val: string) => void; username: string; password: string; error: string; toggle: () => void; }> = ({ onSubmit, setUsername, setPassword, username, password, error, toggle }) => (
  <div className="w-50 p-4 border rounded shadow-sm bg-light">
    <h2 className="text-center mb-4">Register</h2>
    <Form onSubmit={onSubmit}>
      <Alert color="danger" style={divDisplay(!!error, "block", "none")}>{error}</Alert>
      <FormGroup>
        <Label for="username">Username</Label>
        <Input type="text" id="username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label for="password">Password</Label>
        <Input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </FormGroup>
      <Button color="primary" block type="submit">Register</Button>
    </Form>
    <Button color="link" block onClick={toggle}>Already have an account? Login</Button>
  </div>
);

const LoggedInModal: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div className="w-50 p-4 border rounded shadow-sm bg-light text-center">
    <h2>Youre already logged in</h2>
    <Button color="danger" onClick={onLogout}>Logout</Button>
  </div>
);

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toastElement, showToast } = useToast({ duration: 3000 });
  const [authorized, setAuthorized] = useState(false);
  const hub = apiHub();

  const {
    loginWithMetaMask,
    isConnecting: isMetaMaskConnecting,
    error: metamaskError,
    isMetaMaskInstalled,
  } = useMetaMask(hub);

  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
  })

  const userAPI = useLoginAPI(hub, "/users");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username || !password) {
      setError("Both fields are required");
      return;
    }
    if (isRegistering) {
      await userAPI.post<IAuth>("/register", { username, password, confirmPassword: password });
    } else {
      const { data: auth } = await userAPI.post<IAuth>("/login", { username, password });
      setAuth(auth);
      setAuthorized(true);
      if (location.href.includes("prev=")) {
        const prev = new URLSearchParams(location.search).get("prev");
        if (prev) {
          window.location.href = decodeURIComponent(prev);
        }
      }
    }
  };

  const handleMetaMaskLogin = async () => {
    const success = await loginWithMetaMask();
    if (success) {
      setAuthorized(true);
      showToast({ show: true, title: 'Success', message: 'Logged in with MetaMask!', level: 'success' });
      if (location.href.includes("prev=")) {
        const prev = new URLSearchParams(location.search).get("prev");
        if (prev) {
          window.location.href = decodeURIComponent(prev);
        }
      }
    }
  };

  const handleLogout = () => {
    setAuth({ token: "", exp: 0, iat: 0, sub: "", claim: {}, sessionId: "" });
    setAuthorized(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      {authorized ? (
        <LoggedInModal onLogout={handleLogout} />
      ) : isRegistering ? (
        <RegisterModal onSubmit={handleSubmit} setUsername={setUsername} setPassword={setPassword} username={username} password={password} error={error} toggle={() => setIsRegistering(false)} />
      ) : (
        <LoginModal
          onSubmit={handleSubmit}
          setUsername={setUsername}
          setPassword={setPassword}
          username={username}
          password={password}
          error={error}
          toggle={() => setIsRegistering(true)}
          onMetaMaskLogin={handleMetaMaskLogin}
          isMetaMaskInstalled={isMetaMaskInstalled}
          isMetaMaskConnecting={isMetaMaskConnecting}
          metamaskError={metamaskError}
        />
      )}
      {toastElement}
    </Container>
  );
};

export default LoginPage;
