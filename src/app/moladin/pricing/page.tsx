import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Badge,
  Row,
  Col
} from "reactstrap";

// ---------- Types ----------
interface LoanRow {
  disabled: boolean;
  carCategory: string;
  ltv: string;
}

interface LtvGroupItem {
  LtvGroup: string;
  DefaultedTierFor: string[];
  NormalLoan: LoanRow[];
  ExpressLoan: LoanRow[];
}

interface ILtvGroupTables {
  data: LtvGroupItem[];
}

const categories = ["Slow", "Fast", "Fast10Y", "Commercial", "CommercialLux"];

// ---------- Component ----------
const LtvGroupTables = (props: ILtvGroupTables): JSX.Element => {
  const { data } = props;

  const renderLoanTable = (title: string, rows: LoanRow[]) => (
    <>
      <h6 className="mb-2">{title}</h6>
      <Table bordered responsive className="mb-4">
        <thead>
          <tr>
            <th style={{ width: 160 }}>Car Category</th>
            <th style={{ width: 120 }}>LTV</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${title}-${idx}`} className={r.disabled ? "text-muted" : ""}>
              <td>
                {r.disabled ? <s>{r.carCategory}</s> : r.carCategory}
              </td>
              <td>{r.disabled ? <s>{r.ltv}</s> : r.ltv}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );

  return (
    <div className="d-flex flex-row">
      {data.map((group, i) => (
        <Card style={{ marginLeft: '10px '}} key={`ltv-group-${group.LtvGroup}-${i}`}>
          <CardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <strong>{group.LtvGroup}</strong>
            <div className="d-flex flex-wrap gap-1">
              {group.DefaultedTierFor.map((tier, idx) => (
                <Badge key={idx} color="info" pill>
                  {tier}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardBody>
            <Row>
              <Col md={6}>{renderLoanTable("Normal Loan", group.NormalLoan)}</Col>
              <Col md={6}>{renderLoanTable("Express Loan", group.ExpressLoan)}</Col>
            </Row>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};


const sampleData: LtvGroupItem[] = [
  {
    LtvGroup: "Group1",
    DefaultedTierFor: ["Silver", "Bronze"],
    NormalLoan: [
      { disabled: false, carCategory: "Slow", ltv: "75%" },
      { disabled: true, carCategory: "Fast", ltv: "80%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "85%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ],
    ExpressLoan: [
      { disabled: false, carCategory: "Slow", ltv: "65%" },
      { disabled: false, carCategory: "Fast", ltv: "70%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "75%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ]
  },
  {
    LtvGroup: "Group2",
    DefaultedTierFor: ["Gold"],
    NormalLoan: [
      { disabled: false, carCategory: "Slow", ltv: "75%" },
      { disabled: true, carCategory: "Fast", ltv: "80%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "85%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ],
    ExpressLoan: [
      { disabled: false, carCategory: "Slow", ltv: "65%" },
      { disabled: false, carCategory: "Fast", ltv: "70%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "75%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ]
  },
    {
    LtvGroup: "Group3",
    DefaultedTierFor: ["Diamond"],
    NormalLoan: [
      { disabled: false, carCategory: "Slow", ltv: "75%" },
      { disabled: false, carCategory: "Fast", ltv: "80%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "85%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ],
    ExpressLoan: [
      { disabled: false, carCategory: "Slow", ltv: "65%" },
      { disabled: false, carCategory: "Fast", ltv: "70%" },
      { disabled: false, carCategory: "Fast10Y", ltv: "75%" },
      { disabled: false, carCategory: "Commercial", ltv: "85%" },
      { disabled: false, carCategory: "CommercialLux", ltv: "85%" },
    ]
  }
];

export default function App(): JSX.Element {
  return <LtvGroupTables data={sampleData} />;
}

