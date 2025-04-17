import { Empty, Name, Piece, Point, Unknown } from "./piece";
// Empty
export interface IBoard {
  width: number;
  height: number;
  players: Piece[];
  enemies: Piece[];
}

export class Board {
  constructor(private props: IBoard) {}

  emptyBoard(): Piece[][] {
    const init: Piece[][] = [];
    for (let y = 0; y < this.props.height; y++) {
      const row: Piece[] = [];
      for (let x = 0; x < this.props.width; x++) {
        row.push(new Empty({ coordinate: { x, y } }));
      }
      init.push(row);
    }
    return init;
  }

  view(allies: Piece[]): Piece[][] {
    const board = this.visiblities(allies);
    for (let y = 0; y < this.props.height; y++) {
      for (let x = 0; x < this.props.width; x++) {
        const cell = board[y][x];
        if (cell.isUnknown()) {
          board[y][x] = new Empty({ coordinate: { x, y } });
        }
      }
    }
    return board;
  }

  board(): Piece[][] {
    const board = this.emptyBoard();
    for (const player of this.props.players) {
      const { x, y } = player.position();
      board[y][x] = player;
    }
    for (const enemy of this.props.enemies) {
      const { x, y } = enemy.position();
      board[y][x] = enemy;
    }
    return board;
  }

  at(point: Point): Piece {
    const board = this.board();
    const { x, y } = point;
    const ys = board[y];
    return ys[x];
  }

  width(): number {
    return this.props.width;
  }

  height(): number {
    return this.props.height;
  }

  players(): Piece[] {
    return this.props.players;
  }

  enemies(): Piece[] {
    return this.props.enemies;
  }


  visiblities(allies: Piece[]): Piece[][] {
    const board = this.board();
    const isVisible = (p: Point) => {
      return allies.some(piece => piece.canSee(p));
    }

    for (let y = 0; y < this.props.height; y++) {
      for (let x = 0; x < this.props.width; x++) {
        if (!isVisible({ x, y })) {
          board[y][x] = new Unknown({ coordinate: { x, y } });
        }
      }
    }
    return board;
  }

  // playerVisibilities(): Piece[][] {
  //   const { players } = this.props;
  //   return this.visiblities(players);
  // }

  // enemyVisiblities(): Piece[][] {
  //   const { enemies, players } = this.props;
  //   return this.visiblities(enemies);
  // }

}