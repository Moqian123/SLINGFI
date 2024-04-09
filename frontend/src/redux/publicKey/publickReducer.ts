/* eslint-disable import/no-anonymous-default-export */
import {CHANGE_PUBLICKET,ChangePublickeyAction} from './publickActions'
//  从原理上来说，reducer是数据state的处理过程，reducer的返回值则是理由参数传入的返回值state经过数据变化而生成新的数据【即以旧换新的一个过程】
// 所以 state 则是redux数据仓库中的旧数据，action则是指挥数据仓库做出数据变换的指令
interface publicKeyState {
    publicKey:string,
}

const defaultState:publicKeyState = {
    publicKey:'',
}

export default (state = defaultState, action:ChangePublickeyAction) => {
    console.log(state,action);
    if(action.type === CHANGE_PUBLICKET) {
        // 在redux中不能直接修改state
        const newState = {...state,publicKey:action.payload}
        return newState;
    }
    return state
}
