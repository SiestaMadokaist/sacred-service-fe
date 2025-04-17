"use client";
import { useEffect, useState } from "react";
import { ITransactionData } from "./interface";
import { TableInvestment } from "./table";
import { apiHub } from "../../api/hub";
import { useToast } from "../../hooks/useToast";
import { useApi } from "../../hooks/useApi";

const InvestmentPage = (): JSX.Element => {
  const [data, setData] = useState<ITransactionData[]>([]);
  const { toastElement, showToast } = useToast({ duration: 3000 });
  const hub = apiHub();
  useEffect(() => {
    hub.on('api-error', (err) => {
      showToast({ show: true, title: `Error Code: ${err.statusCode}`, message: JSON.stringify(err.data) });
    })
  })
  const investAPI = useApi(hub, '/investments');
  return (<TableInvestment data={data} />);
}

export default InvestmentPage;