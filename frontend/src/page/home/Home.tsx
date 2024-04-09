import React from "react";

import styles from './Home.module.css'

import CountUp from 'react-countup'
import {Row,Col,Typography, Table} from 'antd'
import {columns,data} from './table'

  

export const Home:React.FC = () =>{
    return (
        <div className={styles['page-container']}>
            <div className={styles['page-inner']}>
                <div className={styles['first-part']}>
                    <Typography.Title level={4}>Solana</Typography.Title>
                    <div className={styles['first_part_main']}>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Total Volume (USD)</div>
                            <div className={styles['value_box']}>
                                <CountUp className={styles['value']} start={0} end={14} duration={2} decimals={0} suffix={''} />
                                <CountUp className={styles['value_b']} start={0} end={90} duration={2} decimals={0} prefix={'+'} />
                            </div>
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Total Pool</div>
                            <div className={styles['value_box']}>
                                <CountUp className={styles['value']} start={0} end={0} duration={2} decimals={0} suffix={''} />
                                <CountUp className={styles['value_b']} start={0} end={0} duration={2} decimals={0} prefix={'+'} />
                            </div>
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Total Users</div>
                            <div className={styles['value_box']}>
                                <CountUp className={styles['value']} start={0} end={0} duration={2} decimals={0} suffix={''} />
                                <CountUp className={styles['value_b']} start={0} end={10} duration={2} decimals={0} prefix={'+'} />
                            </div>
                        </div>
                        <div className={styles['first_part_main_item']}>
                            <div className={styles['topic']}>Total Tax</div>
                            <div className={styles['value_box']}>
                                <CountUp className={styles['value']} start={0} end={8.87} duration={2} decimals={2} suffix={''} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles['two-part']}>
                    <Typography.Title level={4}>Overview</Typography.Title>
                    <Row style={{display:'flex',gap:'20px'}}>
                        <Col span={24} style={{borderRadius:'10px',overflow:'hidden'}}>
                            <Table columns={columns} dataSource={data} pagination={{position:['none']}}/>
                        </Col>
                        {/* <Col style={{background:'blue',flex:1,borderRadius:'10px',overflow:'hidden'}}>55</Col> */}
                    </Row>
                </div>
            </div>
        </div>
    )
}