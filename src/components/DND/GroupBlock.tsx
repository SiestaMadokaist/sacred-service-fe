import { Button } from "reactstrap";
import { Creature } from "./Creature/Creature";
import { DMGTracker } from "./Creature/DMGTracker";
import { useState } from "react";

export interface IGroupBlockProps {
  addEnemy: (enemy: Creature) => void;
  inflictDamage: (damage: number) => void;
  onMultiplier: (enemy: Creature) => void;
  enemies: Creature[];
  viewTs: number;
  viewMode: boolean;
}

export function GroupBlock(props: IGroupBlockProps): JSX.Element {
  const [name, setName] = useState<string>('Group X');
  const [enemies, setEnemies] = useState<Creature[]>([]);
  const addToGroup = (enemy: Creature) => {
    props.addEnemy(enemy);
    setEnemies([...enemies, enemy]);
  }
  const updateGroupName = () => {
    const newName = prompt('Enter new group name');
    if (newName) {
      setName(newName);
    }
  }
  return (<div>
    <div onClick={updateGroupName} style={{ cursor: 'pointer', color: 'white', textAlign: 'center' }}> --- {name} --- </div>
    <div title="damage-manager">
      {enemies.map((enemy, index) =>
        (<DMGTracker onMultiplierChange={props.onMultiplier} viewMode={props.viewMode} viewTs={props.viewTs} key={index} enemy={enemy} />)
      )}
    </div>
    <div title="creature-adder">
      <Button className="w-100" color="primary" onClick={() => { addToGroup(new Creature({})); }}>Add Enemy to This Group</Button>
    </div>
  </div>);
}