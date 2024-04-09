import type { TableColumnsType, TableProps } from 'antd';

interface DataType {
    key: React.Key;
    Type: string;
    TVL: string,
    Pools: string,
    Trades: string,
    TradingVolume: string,
    ecoFee: string,
}

export const columns: TableColumnsType<DataType> = [
    {
      title: 'Type',
      dataIndex: 'Type',
    },
    {
      title: 'TVL(USD)',
      dataIndex: 'TVL',
    },
    {
      title: 'Pools',
      dataIndex: 'Pools',
      // sorter: {
      //   compare: (a, b) => a.math - b.math,
      //   multiple: 2,
      // },
    },
    {
      title: 'Trades',
      dataIndex: 'Trades',
    },
    {
      title: 'Trading Volume(USD)',
      dataIndex: 'TradingVolume',
    },
    {
      title: 'Eco Fee',
      dataIndex: 'ecoFee',
    },
  ];
  
  export const data: DataType[] = [
    {
      key: '1',
      Type: 'ZJUP',
      TVL: '--',
      Pools: '--',
      Trades: '--',
      TradingVolume: '--',
      ecoFee: '--',
    },
  ];

export  const onChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter, extra) => {
console.log('params', pagination, filters, sorter, extra);
};