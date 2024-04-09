/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

import styles from './Portolio.module.css'
import { JoinedPool } from "./JoinedPool";
export const Portolio:React.FC = () =>{
    return (
        // <Header></Header>
        <div className={styles['page-container']}>
            <div className={styles['page-inner']}>
                <div style={{marginTop:'20px'}}>
                    <JoinedPool key='joinedlist'/>
                </div>
            </div>
        </div>
    )
}