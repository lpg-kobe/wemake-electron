/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
// @ts-ignore
import { SDK_APP_ID } from '@/constants'
import LaserController from '../controllers/LaserController'

const initialState = {
  /* sa: 机器配置，主要尺寸大小*/
  machineType: 'X1',
  /* sa: gcode配置，包括：jogspeed, workspeed, 激光功率等。*/
  gcodeConfig: {
    mode: 'BW', // sa: BW, GRAY, SVG, 文件
    workspeed: 220, // 单位: mm/min
    multiPass: 1, // sa: 雕刻的次数
    invert: false,
    threshold: 168,
    direction: 'Horizontal'
  },
  /* sa: 导入的原始图片路径 */
  oriFilePath: null,
  /* sa: 导入的原始图片数据*/
  oriFileContent: null,
  laserController: new LaserController()
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
        console.log(dispatch, pathname)
      })
    },
  },
  effects: {
    // demo
    *fetchData({ payload }: any, { call, put }: any) {
      console.log(payload, call, put)
    }
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
