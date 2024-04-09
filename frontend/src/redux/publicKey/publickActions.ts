export const CHANGE_PUBLICKET  = 'change_publickey' ;

export interface ChangePublickeyAction {
    type: typeof CHANGE_PUBLICKET,
    payload: string,
}

// 创建修改publickey的工厂
export const changePublickeyActionCreator = (publicCode:string):ChangePublickeyAction => {
    return {
        type:CHANGE_PUBLICKET,
        payload: publicCode,
    }
}