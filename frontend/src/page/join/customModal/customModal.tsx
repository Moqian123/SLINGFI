import React,{useEffect, useState} from 'react';
import { Modal,Input } from 'antd';
import style from './customModal.module.css'
import {getUsdtPrice} from '../../../lib/Common'

interface ModalProps {
  param:any;
  visible: boolean;
  onOk: (value:string,riceUsd:string) => void;
  onClose: () => void;
}

const CustomModal: React.FC<ModalProps> = ({param, visible, onClose,onOk }) => {
  console.log('param----',param);
  
  const [inputValue, setInputValue] = useState('');
  const [riceUsd, setPriceUsd] = useState('')
  const handleChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
    setInputValue(e.target.value)
  }
  const handleOk = () => {
    onOk(inputValue,riceUsd)
  }
  const getPrice = async() => {
    const price =  await getUsdtPrice('JUP')
    console.log(price);
    setPriceUsd(price)
  }
  useEffect(() => {
   getPrice()
  },[])
  useEffect(() => {
    if(!visible) {
      setInputValue('')
    }
  },[visible])
  return (
    <Modal
      title="Join Pool"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okButtonProps={{style:{background:'#512da8'}}}
    >
      <div className={style['pool-box']}>
        <div>
          <div className={style['text']}>
            <span>Join Layer:</span>
            <span>{param.Curent_Layer}</span>
          </div>
          <div className={style['text']}>
            <span>Join Price:</span>
            <span>${riceUsd}</span>
          </div>
        </div>
        <div>
          <div className={style['text']}>
            <span>Base Unit:</span>
            <span>{parseInt(param.addUnit)} </span>
          </div>
          <div className={style['text']}>
            <span>Join Amount:</span>
            <span>{isNaN(parseInt(param.addUnit) * parseFloat(inputValue)) ? '0' : (parseInt(param.addUnit) * parseFloat(inputValue)).toFixed(2)}</span>
          </div>
          
        </div>
       
        <div className={style['input']}>
           <span>Unit Amount:</span>
           <Input value={inputValue} onChange={handleChange}/>
        </div>
      </div>
    </Modal>
  );
};

export default CustomModal;