import { EventEmitter } from 'events'
export interface ICreature { }

type MultiplierLevel = 'none' | 'half' | 'full';

interface IDamage {
  ts: number;
  fullDamage: number;
}

export interface IDamageHistory {
  ts: number;
  fullDamage: number;
  multiplier: MultiplierLevel;
}

export class Creature {
  private _id: string | null = null;
  private _channel: EventEmitter = new EventEmitter();
  private _multiplierLevel: MultiplierLevel = 'none';
  private _dmgHistories: IDamageHistory[] = [];

  constructor(private props: ICreature) {
  }

  multiplierLevel(viewMode: boolean): string {
    if (viewMode) {
      return 'view-only';
    }
    if (this._multiplierLevel === 'none') {
      return 'x0';
    }
    if (this._multiplierLevel === 'half') {
      return 'x 1/2';
    }
    return 'x 1';
  }

  id(): string {
    if (this._id === null) {
      this._id = Math.random().toString(36).substring(2, 15);
    }
    return this._id;
  }

  emitter(): EventEmitter {
    return this._channel;
  }

  setMultiplier(multiplier: MultiplierLevel): void {
    this._multiplierLevel = multiplier;
  }

  resetMultiplier(): void {
    this._multiplierLevel = 'none';
  }

  nextMultiplier(): void {
    if (this._multiplierLevel === 'none') {
      this._multiplierLevel = 'half';
    } else if (this._multiplierLevel === 'half') {
      this._multiplierLevel = 'full';
    } else {
      this._multiplierLevel = 'none';
    }
    this.emitter().emit('multiplier', {
      id: this.id(),
      multiplier: this._multiplierLevel
    })
  }

  totalDamage(ts: number): number {
    return this._dmgHistories.filter((x) => x.ts <= ts)
      .reduce((acc, dmg) => acc + this.inflictedDamage(dmg.fullDamage, dmg.multiplier), 0);
  }

  multiplierColor(viewMode: boolean): string {
    if (viewMode) {
      return 'light';
    }
    return this._multiplierLevel === 'none' ? 'secondary' : this._multiplierLevel === 'half' ? 'warning' : 'danger';
  }

  inflictedDamage(fullDamage: number, multiplierLevel: MultiplierLevel): number {
    const multiplier = multiplierLevel === 'none' ? 0 : multiplierLevel === 'half' ? 0.5 : 1;
    return Math.floor(fullDamage * multiplier);
  }

  inflict(dmg: IDamage): void {
    const inflictedDamage = this.inflictedDamage(dmg.fullDamage, this._multiplierLevel);
    this._dmgHistories.push({ ...dmg, multiplier: this._multiplierLevel });
    this.emitter().emit('inflict', {
      id: this.id(),
      totalDamage: this.totalDamage(Date.now()),
      inflictedDamage
    });
  }

}