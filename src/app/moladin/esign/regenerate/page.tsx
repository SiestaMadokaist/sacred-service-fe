"use client";
import { Map } from 'immutable';
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import useLocalStorage from "use-local-storage";
import type { IStamp } from "../stamping/pdf-page";
import { Button, Card, CardBody, CardHeader, Input, InputGroup, InputGroupText, Toast } from "reactstrap";
import { EsignAPI } from "../../../../api/api";

interface IVariable {
  varId: string;
  value: string;
  varType: 'token';
  ts: number;
}

interface IToast {
  message: string;
  duration: number;
  backgroundColor: string;
  color: string;
}

interface ISigner {
  role: string;
  email: string;
}

interface IDocument {
  id: string;
  error?: object;
  name: string;
  status: string;
  signers: ISigner[];
  variables: IVariable[];
  stamps: IStamp[];
}


export default function RegeneratePage(): JSX.Element {
  const [documentId, setDocumentId] = useState<string>('');
  const [updatedSigners, setUpdatedSigners] = useState<Map<string, string>>(Map());
  const [updatedVariables, setUpdatedVariables] = useState<Map<string, IVariable>>(Map());
  const defaultToast: IToast = { message: '', duration: 0, backgroundColor: 'white', color: 'black' };
  const [toastParams, setToastParams] = useState<IToast>(defaultToast);
  const [prodToken, setProdToken] = useLocalStorage<string>('prodToken', '');
  const [devToken, setDevToken] = useLocalStorage<string>('devToken', '');
  const [originTs, setOriginTs] = useState<number>(0);
  const [docResponse, setDocResponse] = useState<IDocument | null>(null);
  const [env, setEnv] = useState<'dev' | 'prod'>('dev');
  const configs = {
    dev: {
      token: devToken,
      alias: 'development' as 'development',
    },
    prod: {
      token: prodToken,
      alias: 'production' as 'production',
    }
  }

  const config = configs[env];
  const esignAPI = EsignAPI(config.alias, config.token);
  const glowBorder = {
    border: '1px solid #ff4d4d',
    boxShadow: '0 0 10px #ff4d4d, 0 0 20px #ff4d4d, 0 0 30px #ff4d4d',
    transition: 'box-shadow 0.3s ease',
    borderRadius: '10px',
  }

  const showToast = (option: Partial<IToast> = {}) => {
    setToastParams({ ...defaultToast, ...option });
    setTimeout(() => {
      setToastParams(defaultToast);
    }, option.duration ?? 3000);
  }
  const fetchData = async () => {
    if (documentId === '') {
      return showToast({ message: "Document ID is required" })
    }
    if (prodToken === '') {
      return showToast({ message: "Token is required" })
    }
    const path = `/v1/documents/${documentId}`;
    showToast({ message: "Fetching...", duration: 60_000 });
    setDocResponse(null);
    const now = Date.now();
    setOriginTs(now);
    const response = await esignAPI.get(path).catch((error: AxiosError) => error)
    if (response instanceof Error) {
      showToast({ message: "Fetch Failed", backgroundColor: 'red', color: 'white' })
    } else {
      showToast({ message: "Fetch Success", backgroundColor: 'green', color: 'white' })
      setDocResponse(response.data.data);
      setUpdatedSigners(Map())
      setUpdatedVariables(Map())
    }
  }

  useEffect(() => {
    fetchData();
  }, [env, documentId, prodToken])

  const regenerate = async () => {
    if (documentId === '') {
      return showToast({ message: "Document ID is required" })
    }
    if (prodToken === '') {
      return showToast({ message: "Token is required" })
    }
    const expectedForceToken = Math.floor(Date.now() / 180_000);
    const forceToken = prompt(`please enter ${expectedForceToken} if you're sure to regenerate this document`, '0');
    const path = `/v1/documents/${documentId}/regenerate`;
    await download()
    showToast({ message: "Regenerating...", duration: 60_000 });
    const requestParams = {
      ...regenParams(),
      forceToken: parseInt(forceToken ?? '0'),
    }
    const response = await esignAPI.put(path, requestParams).catch((error: AxiosError) => error)
    if (response instanceof Error) {
      showToast({ message: "Regenerate Failed", backgroundColor: 'red', color: 'white' })
    } else {
      showToast({ message: "Regenerate Success", backgroundColor: 'green', color: 'white' })
      await fetchData();
    }
  }

  const $signers = docResponse?.signers ?? [];
  const $variables = (docResponse?.variables ?? []).filter((x) => x.varType === 'token');

  const onSignerChange = (role: string, email: string) => {
    const updated = updatedSigners.set(role, email)
    setUpdatedSigners(updated)
  }

  const onVariableChange = (varId: string, value: string) => {
    const updated = updatedVariables.set(varId, { varId, value, varType: 'token', ts: originTs })
    setUpdatedVariables(updated)
  }

  const download = async () => {
    const content = JSON.stringify(docResponse, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentId}.backup.json`;
    a.click();
  }

  const yellowIfIn = (key: string, collection: Map<string, unknown>) => {
    return collection.has(key) ? '#dd7' : 'white';
  }

  const regenParams = () => {
    const signers = [...Array.from(updatedSigners.entries()).map(([role, email]) => ({ role, email }))]
    const variables = [...Array.from(updatedVariables.values())]
    const forceToken = '???';
    return { forceToken, signers, variables }
  }
  const prodStyle = env === 'prod' ? glowBorder : {};
  return (
    <div style={{ margin: '1%', width: "98%", ...prodStyle }} className="d-flex">
      <Toast
        style={{ backgroundColor: toastParams.backgroundColor, color: toastParams.color, border: '2px #77B48C solid', position: 'absolute', zIndex: 5, bottom: '100px', left: '35%', width: '30%' }}
        isOpen={toastParams.message !== ''}>
        {toastParams.message}
      </Toast>
      <div style={{ margin: '1%', width: '48%' }} className="d-flex-column">
        <Card style={{ width: '100%' }}>
          <CardHeader>
            <InputGroup>
              <InputGroupText style={{ width: '20%' }} >Environment</InputGroupText>
              <Input type="select" onChange={(e) => setEnv(e.target.value as 'dev' | 'prod')} value={env}>
                <option value="prod">Production</option>
                <option value="dev">Development</option>
              </Input>
            </InputGroup>
          </CardHeader>
          <CardHeader>
            <InputGroup>
              <InputGroupText style={{ width: '20%' }} >Document ID</InputGroupText>
              <Input onChange={(e) => setDocumentId(e.target.value)} placeholder="6645a1850dc022fc4..."></Input>
            </InputGroup>
            <InputGroup>
              <InputGroupText style={{ width: '20%' }} >Prod Token</InputGroupText>
              <Input disabled={env === 'dev'} defaultValue={prodToken} onChange={(e) => setProdToken(e.target.value)}></Input>
            </InputGroup>
            <InputGroup>
              <InputGroupText style={{ width: '20%' }} >DEV Token</InputGroupText>
              <Input disabled={env === 'prod'} defaultValue={devToken} onChange={(e) => setDevToken(e.target.value)}></Input>
            </InputGroup>
          </CardHeader>
          <CardBody style={{ border: '1px black solid', display: docResponse?.error ? 'block' : 'none' }}>
            <h4>Error: </h4>
            <pre style={{ margin: '1%', overflowY: 'scroll' }}>
              {JSON.stringify(docResponse?.error, null, 2)}
            </pre>
          </CardBody>
          <CardBody style={{ height: '60vh', overflowY: 'hidden' }}>
            <pre style={{ margin: '1%', height: '98%', overflowY: 'scroll' }}>
              {JSON.stringify(regenParams(), null, 2)}
            </pre>
          </CardBody>
        </Card>
      </div>

      <div style={{ margin: '1%', width: '48%' }} className="d-flex">
        <Card style={{ height: '83vh', overflow: 'hidden' }}>
          <CardHeader>
            <div style={{ textAlign: 'center', width: '100%' }}>{docResponse?.status}</div>
          </CardHeader>
          <CardBody style={{ height: '100%', overflowY: 'scroll' }}>
            <InputGroup style={{ width: '100%' }}>
              <InputGroupText style={{ width: '100%' }}>Signers: </InputGroupText>
            </InputGroup>
            {$signers.map((signer, i) => (
              <InputGroup key={signer.role}>
                <InputGroupText style={{ width: '30%' }}>{signer.role}</InputGroupText>
                <Input style={{ backgroundColor: yellowIfIn(signer.role, updatedSigners) }} onChange={(e) => onSignerChange(signer.role, e.target.value)} defaultValue={signer.email} />
              </InputGroup>))}
            <br></br>
            <InputGroup style={{ backgroundColor: 'whitesmoke', width: '100%' }}>
              <InputGroupText style={{ backgroundColor: 'whitesmoke', width: '100%' }}> Variables: </InputGroupText>
            </InputGroup>
            {$variables.map((variable, i) => (
              <InputGroup key={variable.varId}>
                <InputGroupText style={{ width: '30%' }}>{variable.varId}</InputGroupText>
                <Input style={{ backgroundColor: yellowIfIn(variable.varId, updatedVariables) }} onChange={(e) => onVariableChange(variable.varId, e.target.value)} defaultValue={variable.value} />
              </InputGroup>
            ))}
          </CardBody>
          <Button onClick={regenerate} color="primary"> Regenerate </Button>
        </Card>
      </div>
    </div>
  )
}