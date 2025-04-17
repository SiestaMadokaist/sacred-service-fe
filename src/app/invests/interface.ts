// Define interfaces
export interface IAsset {
  p: number;
  amount: string;
  unit: string;
}

export interface ITrade {
  receive: IAsset;
  cost: IAsset;
}

export interface ITotalTransactions {
  [asset: string]: ITrade;
}

export interface ITransactionData {
  totalOut: ITotalTransactions;
  ts: number;
  receive: IAsset;
  cost: IAsset;
  u: string;
  totalIn: ITotalTransactions;
  nonce: number;
  description: string;
}

// Define props interface
export interface ITableInvestment {
  data: ITransactionData[];
}