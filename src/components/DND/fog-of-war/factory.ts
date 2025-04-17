import { Point, PieceName, Piece, IPiece, Name, Unknown, Empty } from './piece'
import { Rook, Knight, Bishop, Queen, King, Pawn } from './piece'
type PieceConstructor = new (props: IPiece) => Piece
const order = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
export function PieceFactory(name: string, color: "white" | "black" | "unknown", coordinate: Point): Piece {
  const file = coordinate.x
  const constructor = order[file]
  return new constructor({ name: Name(name), color, coordinate })
}

export function PieceLoad(props: IPiece): Piece {
  // const { name, color, coordinate } = props
  const type = (props as any).type as string
  if (type === "Rook") {
    return new Rook({ ...props })
  }
  if (type === "Knight") {
    return new Knight({ ...props })
  }
  if (type === "Bishop") {
    return new Bishop({ ...props })
  }
  if (type === "Queen") {
    return new Queen({ ...props })
  }
  if (type === "King") {
    return new King({ ...props })
  }
  if (type === "Pawn") {
    return new Pawn({ ...props })
  }
  return new Empty({ ...props })
}