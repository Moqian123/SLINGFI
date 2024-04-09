import { createStore } from 'redux';
import publickReducer from './publicKey/publickReducer';


const store = createStore(publickReducer);

export type RootState = ReturnType<typeof store.getState>

export default store;