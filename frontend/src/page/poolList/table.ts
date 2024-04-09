import type { TableColumnsType, TableProps } from 'antd';

interface DataType {
    key: React.Key;
    POOL_ID: string;
    Mint_Token: string;
    TVL: string;
    Curent_Layer:string;
    Goal_Profit_Ratio: string;
    Profit_Share_Percent: string;
    status:string,
}

export const columns: TableColumnsType<DataType> = [
    {
      title: 'POOL_ID',
      dataIndex: 'POOL_ID',
    },
    {
      title: 'Mint_Token',
      dataIndex: 'Mint_Token',
      // dataIndex: 'chinese',
      // sorter: {
      //   compare: (a, b) => a.chinese - b.chinese,
      //   multiple: 3,
      // },
    },
    {
      title: 'TVL(USD)',
      dataIndex: 'TVL',
      // dataIndex: 'math',
      // sorter: {
      //   compare: (a, b) => a.math - b.math,
      //   multiple: 2,
      // },
    },
    {
      title: 'Curent_Layer',
      dataIndex: 'Curent_Layer',
      // dataIndex: 'english',
      // sorter: {
      //   compare: (a, b) => a.english - b.english,
      //   multiple: 1,
      // },
    },
    {
      title:'Goal_Profit_Ratio',
      dataIndex:'Goal_Profit_Ratio'
    },
    {
      title:'Profit_Share_Percent',
      dataIndex:'Profit_Share_Percent',
    },
    {
      title:'status',
      dataIndex:'status',
    },
    {
      title:'Action',
      dataIndex:'action',
    },
  ];
  
  export const data: DataType[] = [
    {
      key:'1',
      POOL_ID: '11111111',
      Mint_Token: 'zsol',
      TVL: '2343',
      Curent_Layer:'1',
      Goal_Profit_Ratio: '60',
      Profit_Share_Percent: '70',
      status:'off',
    },
  ];

export  const onChange: TableProps<DataType>['onChange'] = (pagination, filters, sorter, extra) => {
console.log('params', pagination, filters, sorter, extra);
};