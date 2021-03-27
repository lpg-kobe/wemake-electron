/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
import { gcodeSplit } from '../../services/home'
const initialState = {
  serialports: []
};

type LocationType = {
  pathname: string;
};

type SetUpType = {
  history: any;
  dispatch(action: any): void;
};

export default {
  namespace: 'home',
  state: immutable.fromJS(initialState),
  subscriptions: {
    setup({ history, dispatch }: SetUpType) {
      return history.listen(({ pathname }: LocationType) => {
        console.log(dispatch, pathname)
      })
    },
  },
  effects: {
    *gcodeSplit({ payload }: any, { call }: any) {
      yield call(gcodeSplit, {})
    }
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
