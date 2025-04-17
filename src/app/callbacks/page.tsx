"use client";
import { useEffect, useState } from 'react'
import { CallbackLog, CallbackLogs, ICallbackLog, LogRenderFlag } from '../../components/callbacks/logs';
import axios from 'axios';
import { Button, Card, CardBody, CardColumns, CardHeader, Input, InputGroup, InputGroupText, Toast } from 'reactstrap';
import { IconCopy } from '@tabler/icons-react';
import useLocalStorage from 'use-local-storage';
import style from './style.module.css';
import { SYSTEM_ENV } from '../../helper/env';

const startingRoom = Math.floor(Math.random() * Math.pow(10, 9)).toString(16);

interface ILogElement {
  index: number;
  logs: CallbackLogs;
  renderFlags: Set<LogRenderFlag>;
}

const LogElement = (props: ILogElement): JSX.Element => {
  const childrens: JSX.Element[] = [];
  const { index, logs, renderFlags } = props;
  const log = logs[index];
  const colorSize = 2;
  const colorIndex = (logs.length - index) % colorSize;
  const cssName = `logElement${colorIndex}`;
  const className = (flag: LogRenderFlag) => {
    return `log_${flag}_${colorIndex}`;
  }
  const renderChild = (flag: LogRenderFlag) => {
    if (!renderFlags.has(flag)) { return }
    const copyLog = () => {
      navigator.clipboard.writeText(log[flag]());
    }

    const childElement = (<div style={{ border: '1px white solid', alignItems: 'center', }} className={`d-flex ${className(flag)}`}>
      <div style={{ width: '100px' }}>{flag}: </div>
      <div className='d-flex-column' style={{ width: '100%' }}>
        <CardBody onClick={copyLog} style={{ cursor: 'pointer', width: '100%' }} color='primary'>
          <IconCopy style={{ margin: 'auto' }}></IconCopy>
        </CardBody>
        <pre style={{ marginTop: 'auto', marginBottom: 'auto' }}>{log[flag]()}</pre>
      </div>
    </div>)
    childrens.push(childElement);
  }
  renderChild('url');
  renderChild('createdAt');
  renderChild('body');
  renderChild('query');
  renderChild('params');
  renderChild('headers');
  return (<div className={`d-flex-column ${style[cssName]} `}>
    {childrens}
  </div>)
}

export default function CallbackPage(): JSX.Element {
  const BASE_URL = `${SYSTEM_ENV.PRIMARY_API}/v1/`;
  const api = axios.create({ baseURL: BASE_URL })
  const [room, setRoom] = useState<string>();
  const [logs, setLogs] = useState<CallbackLogs>([]);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [_renderFlags, setRenderFlags] = useLocalStorage<LogRenderFlag[]>('logRenderFlag', ['query', 'params', 'headers', 'body', 'url', 'createdAt']);
  const renderFlags = new Set(_renderFlags);
  const changeRoom = async (r: string) => {
    if (r.length === 0) return;
    setRoom(r);
    const { data: { data: tmpLogs } } = await api.get<{ data: ICallbackLog[] }>(`/callback-logs?room=${r}`);
    setLogs(tmpLogs.map(x => new CallbackLog(x)));
  }
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tmpRoom = room ?? query.get('room') ?? startingRoom;
    changeRoom(tmpRoom);
    const interval = setInterval(() => changeRoom(tmpRoom), 1000);
    return () => clearInterval(interval);
  }, [room]);

  useEffect(() => {
  }, [renderFlags])

  const buttonColor = (flag: LogRenderFlag) => {
    return renderFlags.has(flag) ? 'primary' : 'secondary';
  }

  const toggleFlag = (flag: LogRenderFlag) => () => {
    if (renderFlags.has(flag)) {
      renderFlags.delete(flag);
    } else {
      renderFlags.add(flag);
    }
    setRenderFlags(Array.from(renderFlags));
  }

  const callbackEndpoint = `${BASE_URL}callback-logs/${room}`;
  const copyEndpoint = () => {
    setToastMessage(`Copied ${callbackEndpoint} to Clipboard`);
    navigator.clipboard.writeText(callbackEndpoint);
    setTimeout(() => setToastMessage(''), 3000);
  }
  return (<div>
    <Toast
      style={{ backgroundColor: 'darkgreen', color: 'white', border: '2px #77B48C solid', position: 'absolute', zIndex: 5, bottom: '100px', left: '35%', width: '30%' }}
      isOpen={toastMessage !== ''}
      fade={true}
    >
      {toastMessage}
    </Toast>
    <div className='d-flex-column' style={{ margin: '10px' }}>
      <InputGroup style={{ marginBottom: '10px' }}>
        <InputGroupText>Room ID:</InputGroupText>
        <Input value={room} onChange={(e) => changeRoom(e.target.value)}></Input>
      </InputGroup>
      <InputGroup style={{ marginBottom: '10px' }}>
        <InputGroupText>Callback Endpoint</InputGroupText>
        <Input disabled value={callbackEndpoint}></Input>
        <InputGroupText>
          <IconCopy style={{ cursor: 'pointer' }} onClick={copyEndpoint} />
        </InputGroupText>
      </InputGroup>
      <InputGroup className={style.renderFlag}>
        <Button onClick={toggleFlag('url')} color={buttonColor('url')}>URL</Button>
        <Button onClick={toggleFlag('createdAt')} color={buttonColor('createdAt')}>Created At</Button>
        <Button onClick={toggleFlag('headers')} color={buttonColor('headers')}>Headers</Button>
        <Button onClick={toggleFlag('body')} color={buttonColor('body')}>Body</Button>
        <Button onClick={toggleFlag('query')} color={buttonColor('query')}>Query</Button>
        <Button onClick={toggleFlag('params')} color={buttonColor('params')}>Params</Button>
      </InputGroup>
    </div>
    <div className='d-flex-column'>
      {logs.map((_, index) => <LogElement key={index} index={index} logs={logs} renderFlags={renderFlags} />)}
    </div>
  </div>)
}