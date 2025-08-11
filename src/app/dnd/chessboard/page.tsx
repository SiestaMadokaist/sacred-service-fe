"use client"

import React, { useEffect, useState } from "react"
import { Board } from "../../../components/DND/fog-of-war/board"
import { At, Bishop, Empty, IPiece, King, Knight, Name, On, Piece, Position, Queen, Rook } from "../../../components/DND/fog-of-war/piece"
import { Button, Input, InputGroup, InputGroupText } from "reactstrap";
import { PieceFactory, PieceLoad } from "../../../components/DND/fog-of-war/factory";
import useLocalStorage from "use-local-storage";

function VisibleBoard(props: { title: string; onMove: () => void; board: Board; allies: Piece[] }): JSX.Element {
  const { board, allies } = props;
  const [selected, setSelected] = useState<Piece>(new Empty({ coordinate: At("A1") }));
  const playable = board.visiblities(allies).reverse();
  const files = playable.map((row, y) => {
    const ranks = row.map((piece, x) => {
      const attr = piece.attributes();
      const onClick = () => {
        if (piece.isPiece()) {
          setSelected(piece)
        } else if (selected.isPiece()) {
          const dst = board.at(piece.position());
          if (dst.isPiece()) {
            return;
          }
          selected.move(piece.position())
          props.onMove();
        }
      }
      return <div onClick={onClick} style={{ ...attr }} key={`player-${y}-${x}`} className="square">{piece.attributes().alternativeText}</div>
    })
    return <div key={`player-${y}`} className="d-flex rank">{ranks}</div>
  });

  const onKill = () => {
    if (!selected.isPiece()) {
      return;
    }
    selected.kill();
    props.onMove();
  }

  const onRevive = () => {
    if (!selected.isPiece()) {
      return;
    }
    selected.revive();
    props.onMove();
  }

  return (<div className="d-flex-column">
    <div className="d-flex-column" style={{ margin: '10px'}}>
      {files}
    </div>
    <div className="d-flex-column">
      <InputGroup style={{ margin: '10px' }}>
        <InputGroupText>{props.title}</InputGroupText>
      </InputGroup>
    </div>
    <div className="d-flex-column" style={{ margin: '10px'}}>
      <InputGroup>
        <InputGroupText style={{ width: '33%', textAlign: 'center' }}>{selected.name()} - {On(selected.position())}</InputGroupText>
        <InputGroupText style={{ width: '33%', textAlign: 'center' }}>
          <Button onClick={onKill}>KILL!</Button>
        </InputGroupText>
        <InputGroupText style={{ width: '33%', textAlign: 'center' }}>
          <Button onClick={onRevive}>REVIVE!</Button>
        </InputGroupText>
      </InputGroup>
    </div>
  </div>)
  
}


export default function Chessboard(): JSX.Element {
  const [board, setBoard] = useState<Board | null>(null);
  const [playerProps, setPlayers] = useLocalStorage<IPiece[]>('encounter3.players', []);
  const [enemyProps, setEnemies] = useLocalStorage<IPiece[]>('encounter3.enemies', []);

  const players = playerProps.map((p) => PieceLoad(p));
  const enemies = enemyProps.map((p) => PieceLoad(p));

  const initEnemies = () => {
    const count = 3;
    const alphabet = "ABCDEFGH";
    const picked = alphabet.split("").sort(() => Math.random() - 0.5).slice(0, count);
    const generated: Piece[] = []
    const names = ['Hydrojinn1', 'Hydrojinn2', 'Oxijinn'];
    for (let i = 0; i < count; i++) {
      const y = Math.floor(Math.random() * 2) + 7;
      const p = PieceFactory(names[i], "black", At(`${picked[i]}${y}` as Position));
      generated.push(p);
    }
    setEnemies(generated.map((p) => p.getProps()));
    setBoard(new Board({ width: 8, height: 8, players, enemies: generated }));
  }

  const initPlayers = () => {
    const generated: Piece[] = [
      PieceFactory("Caelum", "white", At("C1")),
      PieceFactory("Varian", "white", At("G1")),
    ]
    setPlayers(generated.map((p) => p.getProps()));
    setBoard(new Board({ width: 8, height: 8, players: generated, enemies }));
  }

  const [lastUpdated, setLastUpdated] = useState(Date.now());
  useEffect(() => {
    setBoard(new Board({ width: 8, height: 8, players, enemies }));
  }, []);

  const onMove = () => {
    if (board === null) {
      return;
    }
    setLastUpdated(Date.now());
    setPlayers(board.players().map((p) => p.getProps()));
    setEnemies(board.enemies().map((p) => p.getProps()));
  }

  if (board === null) {
    return <div style={{ color: 'whitesmoke' }}>Loading...</div>
  }
  return (
    <div className="d-flex-column">
      <Button style={{ margin: '10px' }} color="primary" onClick={initPlayers}>Init Players</Button>
      <Button style={{ margin: '10px' }} color="primary" onClick={initEnemies}>Init Enemies</Button>
      <Arena lastUpdated={lastUpdated} onMove={onMove} board={board} />
    </div>
  )
}

function Arena(props: { board: Board, lastUpdated: number, onMove: () => void }): JSX.Element {
  const { board } = props;
  useEffect(() => {
    props.onMove();
  }, []);
  return <div className="d-flex">
    <VisibleBoard title={'Player Vision'} onMove={() => props.onMove()} board={board} allies={board.players()} />
    <div className="w-10"></div>
    <VisibleBoard title={'Enemy Vision'} onMove={() => props.onMove()} board={board} allies={board.enemies()} />
  </div>
}