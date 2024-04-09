import React  from 'react';
import { Modal} from 'antd';
import {JoinedPool} from '../../portolio'
import 'antd/dist/reset.css';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

const CustomModal: React.FC<ModalProps> = ({visible, onClose }) => {

  // const redeemHanle = (e) => {
  //   console.log(e);
  // }
  
  return (
    <Modal
      title="Reedem"
      open={visible}
      footer={null}
      width="80%"
      onCancel={onClose}
      style={{width:'80%'}}
      okButtonProps={{style:{background:'#512da8'}}}
    >
      <div>
        {/* <CustomTable  data={[]} type={''} onButtonClick={redeemHanle}/> */}
        <JoinedPool key='join'/>
      </div>
    </Modal>
  );
};

export default CustomModal;