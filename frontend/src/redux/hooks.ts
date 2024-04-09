import {useSelector as useRuduxSelector,TypedUseSelectorHook} from 'react-redux';
import {RootState} from './store';

export const useSelector:TypedUseSelectorHook<RootState> = useRuduxSelector