"use client";
import React, { useEffect, useState } from "react"
import { Board } from "../../../components/DND/fog-of-war/board"
import { At, Bishop, Empty, IPiece, King, Knight, Name, On, Piece, Position, Queen, Rook } from "../../../components/DND/fog-of-war/piece"
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { PieceFactory, PieceLoad } from "../../../components/DND/fog-of-war/factory";
import useLocalStorage from "use-local-storage";

function BoardVisibility(props: { onMove: () => void; board: Board; allies: Piece[] }): JSX.Element {
  const { board, allies } = props;
  const playable = board.view(allies).reverse();
  const files = playable.map((row, y) => {
    const ranks = row.map((piece, x) => {
      const attr = piece.attributes();
      return <div style={{ ...attr }} key={`player-${y}-${x}`} className="square">{attr.alternativeText}</div>
    })
    return <div key={`player-${y}`} className="d-flex rank">{ranks}</div>
  });

  return (<div className="d-flex-column">
    <div className="d-flex-column" style={{ margin: '10px'}}>
      {files}
    </div>
  </div>)
  
}
export default function Encounter(): JSX.Element {
  const [board, setBoard] = useState<Board | null>(null);
  const [playerProps] = useLocalStorage<IPiece[]>('encounter3.players', []);
  const [enemyProps] = useLocalStorage<IPiece[]>('encounter3.enemies', []);

  const players = playerProps.map((p) => PieceLoad(p));
  const enemies = enemyProps.map((p) => PieceLoad(p));

  useEffect(() => {
    setBoard(new Board({ width: 8, height: 8, players, enemies }));
  }, [playerProps, enemyProps]);

  if (board === null) {
    return <div>Loading...</div>
  }

  return (<div className="d-flex">
    <BoardVisibility onMove={() => {}} board={board} allies={board.players()} />
  </div>)
}