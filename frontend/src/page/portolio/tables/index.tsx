/* eslint-disable react-hooks/exhaustive-deps */
import React,{memo} from 'react';
import { Table, Button } from 'antd';
import { ColumnsType } from 'antd/es/table';
import 'antd/dist/reset.css';
export interface PoolData {
    id: string;
    poolAccount: string;
    poolSymbol: string;
    poolStatus: string;
    layerNo:string;
    redeemable: string;
    joinedAmount: string;
    redeemAmount:string,
}

interface TableProps {
    data: PoolData[];
    type:String;
    onButtonClick: (record: PoolData) => void;
}

const CustomTable: React.FC<TableProps> = ({ data, type,onButtonClick }) => {
    const columns: ColumnsType<PoolData> = [
      // { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Pool Account', dataIndex: 'poolAccount', key: 'poolAccount' },
      { title: 'PoolSymbol', dataIndex: 'poolSymbol', key: 'poolSymbol',},
      { title: 'Pool Status', dataIndex: 'poolStatus', key: 'poolStatus',},
      { title: 'Layer No', dataIndex: 'layerNo', key: 'layerNo' },
      { title: 'Redeemable', dataIndex: 'redeemable', key: 'redeemable' },
      { title: 'Joined Amount', dataIndex: 'joinedAmount', key: 'joinedAmount' },
      { title: 'Redeem Amount', dataIndex: 'redeemAmount', key: 'redeemAmount' },
      {
        title: '',
        key: 'action',
        fixed: 'right',
        render: (text, record) => (
          record.redeemable === 'false' ? null :
          (<Button type="primary" style={{ backgroundColor: '#512da8' }}  onClick={() => onButtonClick(record)}>
            Redeem
          </Button>)
        ),
      },
    ];
    // const columnsJoin = type === 'joinedPool' ? columns.pop() :columns
    return <>
       <Table columns={columns} rowKey={(record) => record.id} dataSource={data} scroll={{ x: true }} />
    </>;
};
  
export default memo(CustomTable);