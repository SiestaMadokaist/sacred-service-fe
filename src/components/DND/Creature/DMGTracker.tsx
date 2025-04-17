import react, { useEffect, useState } from 'react';
import { Button, Input, InputGroup } from 'reactstrap';
import { Creature } from './Creature';

export interface IDamageTrackerProps {
  enemy: Creature;
  viewTs: number;
  viewMode: boolean;
  onMultiplierChange: (enemy: Creature) => void;
}
export function DMGTracker(props: IDamageTrackerProps): JSX.Element {
  const [_localTs, setLocalTs] = useState(0);
  const { enemy } = props;
  const onMultiplier = () => {
    enemy.nextMultiplier();
    setLocalTs(Date.now());
    props.onMultiplierChange(enemy);
  }
  useEffect(() => {
    const onDamage = () => {
      setLocalTs(Date.now());
      enemy.resetMultiplier();
    }
    enemy.emitter().on('inflict', onDamage);
    return () => {
      enemy.emitter().removeListener('inflict', onDamage);
    }
  })
  console.log(enemy);
  return (<div className='m-1'>
    <InputGroup>
      <Button disabled={props.viewMode} className='w-20' color={enemy.multiplierColor(props.viewMode)} onClick={onMultiplier}>{enemy.multiplierLevel(props.viewMode)}</Button>
      <Input readOnly value={enemy.totalDamage(props.viewTs)} type="number" placeholder="HP" />
    </InputGroup>
  </div>);
}