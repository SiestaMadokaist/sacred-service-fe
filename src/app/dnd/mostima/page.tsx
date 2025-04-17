"use client"

import { IconCactus, IconHexagon, IconRectangle, IconRectangularPrism, IconSquare, IconTriangle, IconTriangleInverted } from "@tabler/icons-react"
import React, { CSSProperties } from "react"
import { Card, CardBody, CardHeader, List, ListGroup, ListGroupItem } from "reactstrap"

function Element(props: React.HTMLAttributes<HTMLElement>): JSX.Element {
  const defaultStyle: CSSProperties = {
    backgroundColor: 'white',
    textAlign: 'center',
    borderRadius: '2%',
  }
  const style = { ...defaultStyle, ...props.style }
  return <div style={style}>{props.children}</div>
}

function SpellSlot(props: { level: number }): JSX.Element {
  return (<div className="d-flex">
    <div className="d-flex-column">
      <IconTriangle stroke={'1px'} size={90}></IconTriangle>
      <div style={{ fontWeight: 'bold' }}>{props.level}</div>
    </div>
  </div>)
}

export default function Mostima(): JSX.Element {
  return <div className='d-flex-column' style={{ height: '95vh', width: '63vw', border: '1px red solid', margin: '10px' }}>
    <div className="d-flex">
      <Card style={{ width: '90%', margin: 'auto', marginTop: '5px', textAlign: 'center' }}>
        <CardHeader style={{ fontWeight: 'bold' }}>Mostima Cheatsheet</CardHeader>
      </Card>
    </div>
    <div className="d-flex">
      <div className="d-flex" style={{ margin: 'auto' }}>
        <Element style={{ margin: '10px', }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>HP</CardHeader>
            <CardBody className="d-flex">
              <IconHexagon strokeWidth={'1px'} size={90} />
              <IconHexagon strokeWidth={'1px'} size={90} />
            </CardBody>
          </Card>
        </Element>
        <Element style={{ margin: '10px', }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Temp HP</CardHeader>
            <CardBody className="d-flex">
              <IconHexagon strokeWidth={'1px'} size={90} />
              <IconHexagon strokeWidth={'1px'} size={90} />
            </CardBody>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Bastion of Law (1-5) </CardHeader>
            <CardBody>
              <IconSquare strokeWidth={'1px'} size={90} />
            </CardBody>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Restore Balance (PB)</CardHeader>
            <CardBody className="d-flex">
              <div className="d-flex-column" style={{ margin: 'auto' }}>
                <IconSquare stroke={'1px'} size={90}></IconSquare>
              </div>
            </CardBody>
          </Card>
        </Element>
      </div>
    </div>
    <div className="d-flex">
      <div className="d-flex" style={{ margin: 'auto' }}>
        <Element style={{ margin: '10px', }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Sorcery Points</CardHeader>
            <CardBody>
              <IconHexagon strokeWidth={'1px'} size={90} />
            </CardBody>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Spell Slot</CardHeader>
            <CardBody className="d-flex">
              <SpellSlot level={1}></SpellSlot>
              <SpellSlot level={2}></SpellSlot>
              <SpellSlot level={3}></SpellSlot>
              <SpellSlot level={4}></SpellSlot>
              <SpellSlot level={5}></SpellSlot>
              <SpellSlot level={6}></SpellSlot>
              <SpellSlot level={7}></SpellSlot>
              <SpellSlot level={8}></SpellSlot>
              <SpellSlot level={9}></SpellSlot>
            </CardBody>
          </Card>
        </Element>
      </div>
    </div>
    <div className="d-flex">
      <div className="d-flex" style={{ margin: 'auto' }}>
        <Element style={{ margin: '10px' }}>
          <Card style={{ width: '12vw' }}>
            <CardHeader style={{ fontWeight: 'bold' }}>Spell Cards</CardHeader>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Extras</CardHeader>
            <ListGroup style={{ textAlign: 'left' }}>
              <ListGroupItem><IconTriangle /> Necrotic Shroud</ListGroupItem>
              <ListGroupItem><IconTriangle /> Healing Hands</ListGroupItem>
              <ListGroupItem><IconSquare /> Bloodwell Vial </ListGroupItem>
              <ListGroupItem>Broom of Flying </ListGroupItem>
            </ListGroup>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card style={{}}>
            <CardHeader style={{ fontWeight: 'bold' }}>Concentration</CardHeader>
            <CardBody style={{ width: '12vw', height: '40vh' }}>
            </CardBody>
          </Card>
        </Element>
        <Element style={{ margin: '10px' }}>
          <Card>
            <CardHeader style={{ fontWeight: 'bold' }}>Gauntlet Concentration</CardHeader>
            <CardBody style={{ width: '12vw', height: '40vh' }}>
            </CardBody>
          </Card>
        </Element>
      </div>
    </div>
  </div>
}