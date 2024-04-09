/* eslint-disable react-hooks/exhaustive-deps */
import React,{memo} from 'react';
import { Table, Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import 'antd/dist/reset.css';
export interface PoolData {
    id: string;
    POOL_ID: string;
    // Mint_Token: string;
    Mint_Token_name: string;
    TVL: string;
    Curent_Layer:string;
    Goal_Profit_Ratio: string;
    Profit_Share_Percent: string;
    status:string,

}

interface TableProps {
    data: PoolData[];
    onButtonClick: (record: PoolData) => void;
}

const CustomTable: React.FC<TableProps> = ({ data, onButtonClick }) => {
    const columns: ColumnsType<PoolData> = [
      // { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'POOL_ID', dataIndex: 'POOL_ID', key: 'POOL_ID' ,width: 150,},
      // { title: 'Mint_Token', dataIndex: 'Mint_Token', key: 'Mint_Token',width: 150, },
      { title: 'Token Symbol', dataIndex: 'Mint_Token_name', key: 'Mint_Token_name',},
      { title: 'TVL', dataIndex: 'TVL', key: 'TVL' ,width: 150,},
      { title: 'Curent_Layer', dataIndex: 'Curent_Layer', key: 'Curent_Layer' },
      { title: 'Goal_Profit_Ratio', dataIndex: 'Goal_Profit_Ratio', key: 'Goal_Profit_Ratio' },
      { title: 'Profit_Share_Percent', dataIndex: 'Profit_Share_Percent', key: 'Profit_Share_Percent' },
      { title: 'status', dataIndex: 'status', key: 'status' },
      {
        title: 'Action',
        key: 'action',
        fixed: 'right',
        render: (text, record) => (
          <Button type="primary" style={{ backgroundColor: '#512da8' }}  onClick={() => onButtonClick(record)}>
            JOIN
          </Button>
        ),
      },
    ];
    return <>
       <Table columns={columns} rowKey={(record) => record.id} dataSource={data} scroll={{ x: true }} />
    </>;
};
  
export default memo(CustomTable);