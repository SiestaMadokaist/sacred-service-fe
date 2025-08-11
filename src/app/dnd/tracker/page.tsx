"use client";
import { useEffect, useState } from "react";
import { GroupBlock } from "../../../components/DND/GroupBlock";
import { Creature } from "../../../components/DND/Creature/Creature";
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { on } from "events";
import moment from "moment";

export default function TrackerPage(): JSX.Element {
  const [globalTs, setGlobalTs] = useState<number>(0);
  const [enemies, setEnemies] = useState<Creature[]>([]);
  const [damage, _setDamage] = useState<number>(0);
  const [tsHistories, setTsHistories] = useState<number[]>([0]);
  const [tsIndex, setTsIndex] = useState<number>(0);
  const viewTs = tsHistories[tsIndex];
  const viewMode = tsIndex !== tsHistories.length - 1;
  const canDealDamage = enemies.filter((x) => x.multiplierLevel(false) !== 'x0').length > 0;

  const setDamage = (damage: string) => {
    _setDamage(parseInt(damage));
  }

  useEffect(() => {
    const onClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return 'Are you sure you want to leave?';
    }
    window.addEventListener('beforeunload', onClose, true);
    return () => window.removeEventListener('beforeunload', onClose);
  },)

  const addEnemy = (enemy: Creature) => {
    setEnemies([...enemies, enemy]);
  }
  const inflictDamage = () => {
    const ts = Date.now();
    enemies.forEach(enemy => {
      enemy.inflict({ fullDamage: damage, ts });
    });
    setTsHistories([...tsHistories, ts]);
    setTsIndex(tsIndex + 1);
    setGlobalTs(ts);
  }

  const groupBlockProps = {
    addEnemy,
    inflictDamage,
    onMultiplier: () => {
      setGlobalTs(Date.now());
    },
    enemies,
    viewTs,
    viewMode,
  }
  return (<div className="mt-5vh">
    <head>
      <title>DND Damage Tracker</title>
    </head>
    <div className="w-100 d-flex flex-row">
      <div className="w-50" style={{ margin: 'auto' }}>
        <InputGroup className="w-100 m-1">
          <InputGroupText style={{ textAlign: 'center' }} className="w-100">
            <h4 className="w-100 m-1" style={{ textAlign: 'center' }}>Damage Tracker</h4>
          </InputGroupText>
        </InputGroup>
        <InputGroup className="w-100 m-1">
          <InputGroupText className="w-20">
            <h6 className="w-100 m-1" style={{ textAlign: 'center' }}>Version</h6>
          </InputGroupText>
          <Button onClick={() => setTsIndex(Math.max(tsIndex - 1, 0))} color="primary">&lt;-</Button>
          <Input readOnly value={moment(viewTs).utcOffset(7).format("YYYY-MM-DD HH:mm:ss")} />
          <Button onClick={() => setTsIndex(Math.min(tsIndex + 1, tsHistories.length - 1))} color="primary">-&gt;</Button>
        </InputGroup>
        <InputGroup className="w-100 m-1">
          <InputGroupText className="w-20">
            <h6 className="w-100 m-1" style={{ textAlign: 'center' }}>Damage Amount</h6>
          </InputGroupText>
          <Input defaultValue={0} onChange={(e) => setDamage(e.target.value)} type="number"></Input>
          <Button style={{ cursor: 'pointer' }} title={!canDealDamage ? "x" : "-"} className="w-30" disabled={!canDealDamage} color="danger" onClick={inflictDamage}>{canDealDamage ? "Deal Damage" : "No Target Selected"}</Button>
        </InputGroup>
      </div>
    </div>
    <div className="d-flex flex-row w-100 mt-5vh m-5">
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
    </div>
    <div className="d-flex flex-row w-100 mt-5vh m-5">
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
    </div>
    <div className="d-flex flex-row w-100 mt-5vh m-5">
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
      <div className="w-30 m-2">
        <GroupBlock {...groupBlockProps}></GroupBlock>
      </div>
    </div>
  </div>)
}