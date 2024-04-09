import React from "react";
import styles from "./Header.module.css"
import logo from "../../assets/logo.jpg"
import {useNavigate, useLocation} from "react-router-dom";
import { WalletBtn } from "./wallet";


export const Header: React.FC = () => {
    // const [linkIndex,setLinkIndex] = useState(0);
    const navigate = useNavigate()
    const location = useLocation();
    const linkArr = [
      {label:'Dashboard',to:'/'},
      {label:'Pool List',to:'/PoolList'},
      {label:'Create',to:'/Create'},
      {label:'Joined Pool',to:'/Portolio'},
    ]
    console.log('location',location);
    
    return(
        <div className={styles['top-head']}>
           <div className={styles['header-inner']}>
              <div className={styles['header-left']}>
                <div className={styles['head-menu']}>
                  {/* {
                    linkArr.map((item,index) => (
                      <Link key={index} to={item.to} className={ linkIndex === index ? styles['on'] : ''} onClick={() => {
                        setLinkIndex(index)
                      }}>{item.label}</Link>
                    ))
                  } */}
                  {linkArr.map((item,index) => <span key={index} className={ item.to === location.pathname ? styles['on'] : ''} onClick={() => {
                    navigate(item.to,{replace:true});
                  }}>{item.label}</span>)}
                </div>
                <div className={styles['head-logo']}>
                  <div className={styles['logo-box']}>
                    <img src={logo} alt="" className={styles['App-logo']}/>
                  </div>
                  
                  <h3>SLINGFI</h3>
                </div>
              </div>
              <div className={'header-right'}>
                  <WalletBtn />
              </div>
           </div>
        </div>
    )
}