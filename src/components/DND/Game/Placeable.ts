export interface IPlaceable {
  x: number;
  y: number;
  width: number;
  height: number;
}
export class Placeable {
  constructor(private props: IPlaceable) {
  }
}

export class Movable extends Placeable {
  constructor(props: IPlaceable, speed: number) {
    super(props);
  }
}