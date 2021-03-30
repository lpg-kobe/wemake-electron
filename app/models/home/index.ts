/**
 * @desc system modal during app, base in react-redux and redux-saga
 */
import immutable from 'immutable';
import { gcodeSplit } from '../../services/home'
const initialState = {
    serialports: [],
    modelGroup: new ModelGroup(),
    toolPathModelGroup: new ToolPathModelGroup(),

    isAllModelsPreviewed: false,
    isGcodeGenerated: false,
    gcodeBeans: [], // gcodeBean: { gcode, modelInfo }
    
    selectedModelID: null,
    sourceType: '',
    mode: '', // bw, greyscale, vector
    printOrder: 1,
    transformation: {},
    gcodeConfig: {},
    config: {},

    // snapshot state
    undoSnapshots: [{ models: [], toolPathModels: [] }], // snapshot { models, toolPathModels }
    redoSnapshots: [], // snapshot { models, toolPathModels }
    canUndo: false,
    canRedo: false,

    // modelGroup state
    hasModel: false,
    isAnyModelOverstepped: false,

    // boundingBox: new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()), // bbox of selected model
    background: {
        enabled: false,
        group: new THREE.Group()
    },

    previewUpdated: 0,
    previewFailed: false,
    autoPreviewEnabled: true,

    // rendering
    renderingTimestamp: 0
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
      yield call(gcodeSplit, payload)
    }
  },

  reducers: {
    save(state: any, { payload }: any) {
      return state.merge(payload);
    },
  },
};
