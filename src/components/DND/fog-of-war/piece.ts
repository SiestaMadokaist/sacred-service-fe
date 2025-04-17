export interface Point {
  x: number
  y: number
}

type File = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type Rank = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
export type Position = `${Rank}${File}`
export type PieceName = string & { __pieceName: never }

export function Name(name: string): PieceName {
  return name as PieceName
}

export function On(p: Point): Position {
  return `${String.fromCharCode('A'.charCodeAt(0) + p.x)}${p.y + 1}` as Position
}

export function At(p: Position): Point {
  const x = p.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
  const y = Number(p[1]) - 1
  return { x, y }
}

export interface IPiece {
  dead?: boolean
  name: PieceName
  coordinate: Point
  color: "white" | "black" | "unknown"
}

interface IPieceAttr {
  color: string;
  border: string;
  innerText: string;
  alternativeText: string;
  width: string;
  height: string;
  backgroundColor: string;
}

const pxHeight = '70px'
const pxWidth = '70px'
const css = {
  width: pxWidth,
  height: pxHeight,
  border: '1px black solid',
  textAlign: 'center',
  verticalAlign: 'middle',
}

export abstract class Piece {
  constructor(protected props: IPiece) {}

  getProps(): IPiece {
    return { 
      ...this.props, 
      type: this.type(),
      dead: this.isDead(),
    } as IPiece
  }

  type(): string {
    return this.constructor.name
  }

  fullName(): string {
    return `${this.type()} ${this.props.name}`
  }

  protected abstract vision(point: Point): boolean

  canSee(point: Point): boolean {
    if (point.x === this.position().x && point.y === this.position().y) {
      return true
    }
    if (this.isDead()) {
      return false
    }
    return this.vision(point)
  }

  isDead(): boolean {
    return this.props.dead ?? false
  }

  revive(): void {
    this.props.dead = false
  }

  isUnknown(): boolean {
    return false
  }

  isPiece(): boolean {
    return true
  }

  isEmpty(): boolean {
    return false
  }

  position(): Point {
    return this.props.coordinate
  }

  bgColor(): string {
    if (this.isDead()) {
      return '#833'
    }
    if (this.props.color === 'white') {
      return 'purple'
    }
    return 'wheat';
  }

  textColor(): string {
    return this.props.color
  }

  alternativeText(): string {
    return this.fill()
  }

  attributes(): IPieceAttr {
    return {
      ...css,
      color: this.textColor(),
      innerText: this.fill(),
      alternativeText: this.alternativeText(),
      backgroundColor: this.bgColor(),
    }
  }

  name(): PieceName {
    return this.props.name
  }

  fill(): string {
    return `${this.props.name}`
  }

  move(point: Point): void {
    this.props.coordinate = point
  }

  kill(): void {
    this.props.dead = true
  }

}

export class Rook extends Piece {
  vision(point: Point): boolean {
    return point.x === this.position().x || point.y === this.position().y
  }
}

export class Bishop extends Piece {
  vision(point: Point): boolean {
    return Math.abs(point.x - this.position().x) === Math.abs(point.y - this.position().y)
  }
}

export class Queen extends Piece {
  vision(point: Point): boolean {
    return new Rook(this.props).vision(point) || new Bishop(this.props).vision(point)
  }
}

export class King extends Piece {
  vision(point: Point): boolean {
    return Math.abs(point.x - this.position().x) <= 1 && Math.abs(point.y - this.position().y) <= 1
  }
}

export class Knight extends Piece {
  vision(point: Point): boolean {
    if (point.x === this.position().x && point.y === this.position().y) {
      return true
    }
    return (
      (Math.abs(point.x - this.position().x) === 2 && Math.abs(point.y - this.position().y) === 1) ||
      (Math.abs(point.x - this.position().x) === 1 && Math.abs(point.y - this.position().y) === 2)
    )
  }
}

export class Pawn extends Piece {
  vision(point: Point): boolean {
    return Math.abs(point.x - this.position().x) === 1 && point.y - this.position().y === 1
  }
}

export class Empty extends Piece {
  constructor(props: { coordinate: Point }) {
    super({ dead: true, name: Name('****'), color: 'unknown', coordinate: props.coordinate })
  }

  isEmpty(): boolean {
    return true
  }

  isPiece(): boolean {
    return false
  }

  vision(_: Point): boolean {
    return false
  }

  fullName(): string {
    return '';
  }


  attributes(): IPieceAttr {
    return {
      ...css,
      color: "black",
      alternativeText: '',
      innerText: On(this.position()),
      backgroundColor: "lightgray"
    }
  }

}

export class Unknown extends Piece {

  constructor(props: { coordinate: Point }) {
    super({ dead: true, name: Name('*****'), color: 'unknown', coordinate: props.coordinate })
  }

  fullName(): string {
    return '';
  }

  vision(_: Point): boolean {
    return false
  }

  isPiece(): boolean {
    return false
  }

  isUnknown(): boolean {
    return true
  }

  attributes(): IPieceAttr {
    return {
      ...css,
      color: "black",
      alternativeText: '',
      innerText: On(this.position()),
      backgroundColor: "gray"
    }
  }
}
