"use client";
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import useLocalStorage from 'use-local-storage';
import { Button, Input, InputGroup, InputGroupText } from 'reactstrap';
import axios from 'axios';
import { SYSTEM_ENV } from '../../../../helper/env';


export default function ReportingPage(): JSX.Element {
  const [sourceURL, setSourceURL] = useState<string>('');
  const [sheetURL, setSheetURL] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('');
  const [report, setReport] = useState<{ ts: number, message: string }>({ ts: 0, message: '' });
  const [callbackId, setCallbackId] = useLocalStorage<string>('callbackId', '');
  const filled = (s: string) => { return s !== '' };
  const ready = filled(sourceURL) && filled(sheetURL) && filled(sheetName);
  const onClick = async () => {
    const request = axios.create({ baseURL: SYSTEM_ENV.OSS_API });
    const sheetId = sheetURL.split('/')[5];
    const cbId = Math.floor(Math.random() * Math.pow(10, 9)) + 1000_000_000;
    setCallbackId(`${cbId}`)
    await request.post('yellowai/reports', {
      sourceURL,
      callback: `${SYSTEM_ENV.PRIMARY_API}/v1/callback-logs?room=${cbId}`,
      sheetId,
      sheetName,
    });
  }

  const fetchReport = async (callbackId: string) => {
    const { data: { data } } = await axios.get(`${SYSTEM_ENV.PRIMARY_API}/v1/callback-logs?room=${callbackId}`);
    const { message } = data[0].body;
    await new Promise(r => setTimeout(r, 5000));
    setReport({ ts: Date.now(), message });
  }

  useEffect(() => {
    if (callbackId === '') {
      return;
    }
    fetchReport(callbackId);
  }, [callbackId, report.ts]);
  return (<div className='d-flex flex-row w-100' style={{ margin: '10px' }}>
    <div className='w-50'>
      <InputGroup className='mt-5vh'>
        <InputGroupText>Source URL</InputGroupText>
        <Input onChange={(e) => setSourceURL(e.target.value)} placeholder='https://r2.app.yellow.ai/minio/r2-ym-exports...'></Input>
      </InputGroup>
      <InputGroup className='mt-5vh'>
        <InputGroupText>Sheet URL</InputGroupText>
        <Input onChange={(e) => setSheetURL(e.target.value)} placeholder='https://docs.google.com/spreadsheets/d/...'></Input>
      </InputGroup>
      <InputGroup className='mt-5vh'>
        <InputGroupText>Sheet Name</InputGroupText>
        <Input onChange={(e) => setSheetName(e.target.value)} placeholder='Sheet1'></Input>
      </InputGroup>
      <Button onClick={onClick} color='primary' className='mt-5vh w-100' disabled={!ready}>Submit</Button>
    </div>
    <div className='w-50'>
      <textarea className='mt-5vh ml-5 w-90 h-50' value={report.message} readOnly></textarea>
    </div>

    {/* <div>
      <InputGroup className='mt-5vh'>
        <InputGroupText>Report</InputGroupText>
        <Input value={report} readOnly onClick={onClick}></Input>
      </InputGroup>
    </div> */}
  </div>)

}