/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
// @ts-ignore
import { SDK_APP_ID } from '@/constants'
const initialState = {
  // system table contain all table in route component
  table: {},
  // set tableId in order to update after Table change
  updateTableId: '',
};

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch(action: any): void;
};

export default {
  namespace: 'system',
  state: immutable.fromJS(initialState),
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        console.log(dispatch,pathname)
      })
    },
  },
  effects: {
    // demo
    *fetchData({ payload }: any, { call, put }: any) {
      console.log(payload,call,put)
    }
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
