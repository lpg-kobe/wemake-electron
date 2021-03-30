import path from 'path';
import * as THREE from 'three';
import api from '../../api';
import controller from '../../lib/controller';
import { DEFAULT_TEXT_CONFIG, sizeModelByMachineSize, generateModelDefaultConfigs, checkParams } from '../models/ModelInfoUtils';
import { checkIsAllModelsPreviewed, computeTransformationSizeForTextVector } from './helpers';

import logger from '../utils/log';
const log = logger('Laser')

export const actions = {
    updateTransformation: (transformation) => {
        return {
            type: 'home/save',
            payload: {
                transformation: {
                    ...transformation
                }
            };
        },

            updateGcodeConfig: (gcodeConfig) => {
                return {
                    type: 'home/save',
                    payload: {
                        gcodeConfig: {
                            ...gcodeConfig
                        }
                    }
                };
            },

                updateConfig: (config) => {
                    return {
                        type: 'home/save',
                        payload: {
                            config: {
                                ...config
                            }
                        }
                    };
                },

                    resetCalculatedState: () => {
                        return {
                            type: 'home/save',
                            payload: {
                                isAllModelsPreviewed: false,
                                isGcodeGenerated: false,
                                gcodeBeans: []
                            }
                        };
                    },

                        updateState: (newSate) = {
                            return {
                                type: 'home/save',
                                payload: {
                                    ...newSate
                                }
                            };
                        }

        render: () => {
            return {
                type: 'home/save',
                payload: {
                    renderingTimestamp: +new Date()
                }
            };
        },

            init: () => (dispatch) => {
                const controllerEvents = {
                    'task:completed': (taskResult) => {
                        dispatch(sharedActions.onReceiveTaskResult('laser', taskResult));
                    }
                };

                Object.keys(controllerEvents).forEach(event => {
                    controller.on(event, controllerEvents[event]);
                });
            },

                setBackgroundEnabled: (enabled) => {
                    return {
                        type: 'home/save',
                        payload: {
                            enabled
                        }
                    };
                },

                    setBackgroundImage: (filename, width, height, dx, dy) => (dispatch, getState) => {
                        const imgPath = `${DATA_PREFIX}/${filename}`;
                        const texture = new THREE.TextureLoader().load(imgPath);
                        const material = new THREE.MeshBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 1,
                            map: texture
                        });
                        const geometry = new THREE.PlaneGeometry(width, height);
                        const mesh = new THREE.Mesh(geometry, material);
                        const x = dx + width / 2;
                        const y = dy + height / 2;
                        mesh.position.set(x, y, 0);

                        const state = getState().laser;
                        const { group } = state.background;
                        group.remove(...group.children);
                        group.add(mesh);
                        dispatch(actions.setBackgroundEnabled(true));
                    },

                        removeBackgroundImage: () => (dispatch, getState) => {
                            const state = getState().laser;
                            const { group } = state.background;
                            group.remove(...group.children);
                            dispatch(actions.setBackgroundEnabled(false));
                        }
    };
    uploadImage: (file, mode, onError) => (dispatch) => {
        if (!file) {
            onError(`Params error: file = ${file}`);
            return;
        }
        if (!['greyscale', 'bw', 'vector'].includes(mode)) {
            onError(`Params error: mode = ${mode}`);
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        /*
        api.uploadImage(formData)
            .then((res) => {
                const { width, height, originalName, uploadName } = res.body;

                dispatch(actions.generateModel(headerType, originalName, uploadName, width, height, mode));
            })
            .catch((err) => {
                onError && onError(err);
            });
        */
    },

    generateModel: (originalName, uploadName, sourceWidth, sourceHeight, mode) => (dispatch, getState) => {
        const { size } = getState().machine;
        const { modelGroup, toolPathModelGroup } = getState();

        const sourceType = path.extname(uploadName).toLowerCase() === '.svg' ? 'svg' : 'raster';

        const { width, height } = sizeModelByMachineSize(size, sourceWidth, sourceHeight);
        // Generate geometry
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({ color: 0xe0e0e0, visible: false });

        if (!checkParams(sourceType, mode)) {
            log.debug('invalid sourceType[$sourceType}]');
            return;
        }

        const modelDefaultConfigs = generateModelDefaultConfigs(mode);
        let { config } = modelDefaultConfigs;
        const { gcodeConfig } = modelDefaultConfigs;

        let transformation = {};
        const modelState = modelGroup.generateModel({
            limitSize: size,
            headerType,
            sourceType,
            originalName,
            uploadName,
            mode,
            sourceWidth,
            sourceHeight,
            geometry,
            material,
            transformation
        });
        const toolPathModelState = toolPathModelGroup.generateToolPathModel({
            modelID: modelState.selectedModelID,
            config,
            gcodeConfig
        });

        dispatch({
            ...modelState,
            ...toolPathModelState
        });

        //dispatch(actions.previewModel(headerType));
        dispatch(actions.resetCalculatedState());
        dispatch(actions.updateState({
            hasModel: true
        }));

        //dispatch(actions.recordSnapshot(headerType));
        dispatch(actions.render());
    },

    insertDefaultTextVector: (dispatch, getState) => {
        const { size } = getMachineSize(getState().machine);// getState().machine;

        api.convertTextToSvg(DEFAULT_TEXT_CONFIG)
            .then((res) => {
                const { originalName, uploadName, width, height } = res.body;
                const { modelGroup, toolPathModelGroup } = getState();
                const material = new THREE.MeshBasicMaterial({ color: 0xe0e0e0, visible: false });
                const sourceType = 'text';
                const mode = 'vector';
                const textSize = computeTransformationSizeForTextVector(
                    DEFAULT_TEXT_CONFIG.text, DEFAULT_TEXT_CONFIG.size, DEFAULT_TEXT_CONFIG.lineHeight, { width, height }
                );
                const geometry = new THREE.PlaneGeometry(textSize.width, textSize.height);

                if (!checkParams(sourceType, mode)) {
                    return;
                }

                const modelDefaultConfigs = generateModelDefaultConfigs(sourceType, mode);
                const config = { ...modelDefaultConfigs.config, ...DEFAULT_TEXT_CONFIG };
                const { gcodeConfig } = modelDefaultConfigs;

                // const model = new Model(modelInfo);
                const modelState = modelGroup.generateModel({
                    limitSize: size,
                    headerType: 'laser',
                    mode,
                    sourceType,
                    originalName,
                    uploadName,
                    sourceWidth: width,
                    sourceHeight: height,
                    geometry,
                    material,
                    transformation: {
                        width: textSize.width,
                        height: textSize.height
                    }
                });
                const toolPathModelState = toolPathModelGroup.generateToolPathModel({
                    modelID: modelState.selectedModelID,
                    config,
                    gcodeConfig
                });

                dispatch({
                    ...modelState,
                    ...toolPathModelState
                });

                //dispatch(actions.previewModel(from));
                dispatch(actions.resetCalculatedState());
                dispatch(actions.updateState({
                    hasModel: true
                }));
                i//dispatch(actions.recordSnapshot(from));
                dispatch(actions.render());
            });
    },

    getEstimatedTime: (type) => (dispatch, getState) => {
        const { modelGroup } = getState();
        if (type === 'selected') {
            return modelGroup.estimatedTime;
        } else {
            // for (const model of modelGroup.children) {
            return modelGroup.totalEstimatedTime();
        }
    },

    getSelectedModel: () => (dispatch, getState) => {
        const { modelGroup } = getState();
        return modelGroup.getSelectedModel();
    },

    selectModel: (modelMeshObject) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        const selectedModelState = modelGroup.selectModel(modelMeshObject);
        const toolPathModelState = toolPathModelGroup.selectToolPathModel(selectedModelState.selectedModelID);

        const state = {
            ...selectedModelState,
            ...toolPathModelState
        };
        dispatch(state);
    },

    removeSelectedModel: (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        const modelState = modelGroup.removeSelectedModel();
        const toolPathModelState = toolPathModelGroup.removeSelectedToolPathModel();
        dispatch(actions.updateState({
            ...modelState,
            ...toolPathModelState
        });
        if (!modelState.hasModel) {
            dispatch(actions.updateState({
                stage: 0,
                progress: 0
            }));
        }
        // dispatch(actions.recordSnapshot(from));
        dispatch(actions.render());
    },

    unselectAllModels: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        const modelState = modelGroup.unselectAllModels();
        const toolPathModelState = toolPathModelGroup.unselectAllModels();
        dispatch({
            ...modelState,
            ...toolPathModelState
        });
    },

    // gcode
    generateGcode: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        // bubble sort: https://codingmiles.com/sorting-algorithms-bubble-sort-using-javascript/
        const gcodeBeans = toolPathModelGroup.generateGcode();
        for (const gcodeBean of gcodeBeans) {
            const modelState = modelGroup.getModelState(gcodeBean.modelInfo.modelID);
            gcodeBean.modelInfo.mode = modelState.mode;
            gcodeBean.modelInfo.originalName = modelState.originalName;
        }
        dispatch(actions.updateState({
            isGcodeGenerated: true,
            gcodeBeans
        }));
    },

    updateSelectedModelPrintOrder: (printOrder) => (dispatch, getState) => {
        const { toolPathModelGroup } = getState();
        toolPathModelGroup.updateSelectedPrintOrder(printOrder);

        dispatch(actions.updateState({ printOrder }));
        dispatch(actions.resetCalculatedState());
    },

    updateSelectedModelGcodeConfig: (gcodeConfig) => (dispatch, getState) => {
        const { toolPathModelGroup } = getState();
        toolPathModelGroup.updateSelectedGcodeConfig(gcodeConfig);
        dispatch(actions.updateGcodeConfig(gcodeConfig));
        //dispatch(actions.previewModel(from));
        //dispatch(actions.recordSnapshot(from));
        dispatch(actions.resetCalculatedState());
    },

    updateSelectedModelConfig: (config) => (dispatch, getState) => {
        const { toolPathModelGroup } = getState();
        toolPathModelGroup.updateSelectedConfig(config);
        dispatch(actions.updateConfig(config));
        // dispatch(actions.previewModel(from));
        // dispatch(actions.recordSnapshot(from));
        dispatch(actions.resetCalculatedState());
    },

    updateSelectedModelTextConfig: (config) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, transformation } = getState();
        const toolPathModelState = toolPathModelGroup.getSelectedToolPathModelState();
        const newConfig = {
            ...toolPathModelState.config,
            ...config
        };
        api.convertTextToSvg(newConfig)
            .then((res) => {
                const { originalName, uploadName, width, height } = res.body;
                const source = { originalName, uploadName, sourceHeight: height, sourceWidth: width };

                const textSize = computeTransformationSizeForTextVector(newConfig.text, newConfig.size, newConfig.lineHeight, { width, height });

                modelGroup.updateSelectedSource(source);
                modelGroup.updateSelectedModelTransformation({ ...textSize });
                toolPathModelGroup.updateSelectedConfig(newConfig);

                dispatch(actions.updateState({
                    ...source,
                    newConfig,
                    transformation: {
                        ...transformation,
                        ...textSize
                    }
                }));

                dispatch(actions.showModelObj3D());
                //dispatch(actions.previewModel(from));
                dispatch(actions.updateConfig(newConfig));
                dispatch(actions.resetCalculatedState());
                //dispatch(actions.recordSnapshot());
                dispatch(actions.render());
            });
    },

    onSetSelectedModelPosition: (position) => (dispatch, getState) => {
        const { transformation } = getState();
        let posX = 0;
        let posY = 0;
        const { width, height } = transformation;
        switch (position) {
            case 'Top Left':
                posX = -width / 2;
                posY = height / 2;
                break;
            case 'Top Middle':
                posX = 0;
                posY = height / 2;
                break;
            case 'Top Right':
                posX = width / 2;
                posY = height / 2;
                break;
            case 'Center Left':
                posX = -width / 2;
                posY = 0;
                break;
            case 'Center':
                posX = 0;
                posY = 0;
                break;
            case 'Center Right':
                posX = width / 2;
                posY = 0;
                break;
            case 'Bottom Left':
                posX = -width / 2;
                posY = -height / 2;
                break;
            case 'Bottom Middle':
                posX = 0;
                posY = -height / 2;
                break;
            case 'Bottom Right':
                posX = width / 2;
                posY = -height / 2;
                break;
            default:
                posX = 0;
                posY = 0;
        }
        transformation.positionX = posX;
        transformation.positionY = posY;
        transformation.rotationZ = 0;
        dispatch(actions.updateSelectedModelTransformation(transformation));
        dispatch(actions.onModelAfterTransform());
    },

    onFlipSelectedModel: (flipStr) => (dispatch, getState) => {
        const { transformation } = getState();
        let flip = transformation.flip;
        switch (flipStr) {
            case 'Vertical':
                flip ^= 1;
                break;
            case 'Horizontal':
                flip ^= 2;
                break;
            case 'Reset':
                flip = 0;
                break;
            default:
        }
        transformation.flip = flip;
        dispatch(actions.updateSelectedModelTransformation(transformation));
        dispatch(actions.onModelAfterTransform());
    },

    /*
    bringSelectedModelToFront() {
        const margin = 0.01;
        const sorted = this.getSortedModelsByPositionZ();
        for (let i = 0; i < sorted.length; i++) {
            sorted[i].position.z = (i + 1) * margin;
        }
        const selected = this.getSelectedModel();
        selected.position.z = (sorted.length + 2) * margin;
    }

    sendSelectedModelToBack() {
        const margin = 0.01;
        const sorted = this.getSortedModelsByPositionZ();
        for (let i = 0; i < sorted.length; i++) {
            sorted[i].position.z = (i + 1) * margin;
        }
        const selected = this.getSelectedModel();
        selected.position.z = 0;
    }
    */

    bringSelectedModelToFront: () => (dispatch, getState) => {
        const { modelGroup } = getState();
        modelGroup.bringSelectedModelToFront();
    },

    sendSelectedModelToBack: () => (dispatch, getState) => {
        const { modelGroup } = getState();
        modelGroup.sendSelectedModelToBack();
    },

    arrangeAllModels2D: () => (dispatch, getState) => {
        const { modelGroup } = getState();
        modelGroup.arrangeAllModels2D();
    },

    updateSelectedModelTransformation: (transformation) => (dispatch, getState) => {
        const { modelGroup } = getState();
        const modelState = modelGroup.updateSelectedModelTransformation(transformation);

        dispatch(actions.updateTransformation(modelState.transformation));
        dispatch(actions.showModelObj3D());
        dispatch(actions.resetCalculatedState());
        dispatch(actions.render());
    },

    // callback
    onModelTransform: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        const modelState = modelGroup.onModelTransform();
        //toolPathModelGroup.cancelSelectedPreview();
        dispatch(actions.updateTransformation(modelState.transformation));
        dispatch(actions.showModelObj3D();
    },

    onModelAfterTransform: () => (dispatch, getState) => {
        const { modelGroup } = getState();
        if (modelGroup) {
            const modelState = modelGroup.onModelAfterTransform();
            dispatch(actions.updateState({ modelState }));
            //dispatch(actions.previewModel());
            //dispatch(actions.recordSnapshot());
        }

    },

    setAutoPreview: (value) => (dispatch) => {
        dispatch(actions.updateState({
            autoPreviewEnabled: value
        }));
        dispatch(actions.manualPreview());
    },

    // todo: listen config, gcodeConfig
    initSelectedModelListener: () => (dispatch, getState) => {
        const { modelGroup } = getState();

        modelGroup.onSelectedModelTransformChanged = () => {
            const modelState = modelGroup.onModelTransform();
            dispatch(actions.showAllModelsObj3D());
            //dispatch(actions.manualPreview());
            dispatch(actions.updateTransformation(modelState.transformation));
            //dispatch(actions.recordSnapshot(from));
            dispatch(actions.render());
        };

        // modelGroup.addEventListener('update', () => {
        modelGroup.object.addEventListener('update', () => {
            dispatch(actions.render());
        });
    },

    showAllModelsObj3D: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        modelGroup.showAllModelsObj3D();
        toolPathModelGroup.hideAllModelsObj3D();
    },

    showModelObj3D: (modelID) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        if (!modelID) {
            const modelState = modelGroup.getSelectedModelTaskInfo();
            if (!modelState) {
                return;
            }
            modelID = modelState.modelID;
        }
        modelGroup.showModelObj3D(modelID);
        toolPathModelGroup.hideToolPathObj3D(modelID);
    },

    showToolPathModelObj3D: (modelID) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup } = getState();
        if (!modelID) {
            const modelState = modelGroup.getSelectedModelTaskInfo();
            if (!modelState) {
                return;
            }
            modelID = modelState.modelID;
        }
        if (modelID) {
            modelGroup.hideModelObj3D(modelID);
            toolPathModelGroup.showToolPathObj3D(modelID);
        }
    },

    manualPreview: (isPreview) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, autoPreviewEnabled } = getState();
        if (isPreview || autoPreviewEnabled) {
            for (const model of modelGroup.getModels()) {
                const modelTaskInfo = model.getTaskInfo();
                const toolPathModelTaskInfo = toolPathModelGroup.getToolPathModelTaskInfo(modelTaskInfo.modelID);
                if (toolPathModelTaskInfo) {
                    const taskInfo = {
                        ...modelTaskInfo,
                        ...toolPathModelTaskInfo
                    };
                    controller.commitTask(taskInfo);
                }
            }
        }
    },

    previewModel: (isPreview) => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, autoPreviewEnabled } = getState();
        if (isPreview || autoPreviewEnabled) {
            const modelTaskInfo = modelGroup.getSelectedModelTaskInfo();
            if (modelTaskInfo) {
                const toolPathModelTaskInfo = toolPathModelGroup.getToolPathModelTaskInfo(modelTaskInfo.modelID);
                if (toolPathModelTaskInfo) {
                    const taskInfo = {
                        ...modelTaskInfo,
                        ...toolPathModelTaskInfo
                    };
                    controller.commitTask(taskInfo);
                }
            }
        }
    },

    onReceiveTaskResult: (taskResult) => async (dispatch, getState) => {
        // const state = getState()[from];
        const { toolPathModelGroup } = getState();

        if (taskResult.status === 'failed' && toolPathModelGroup.getToolPathModelByTaskID(taskResult.taskID)) {
            dispatch(actions.updateState({
                previewUpdated: +new Date(),
                previewFailed: true
            }));
            dispatch(actions.setAutoPreview(false));
            return;
        }

        const toolPathModelState = await toolPathModelGroup.receiveTaskResult(taskResult);

        if (toolPathModelState) {
            dispatch(actions.showToolPathModelObj3D(toolPathModelState.modelID));
        }

        dispatch(actions.updateState({
            previewUpdated: +new Date(),
            previewFailed: false
        }));
        dispatch(actions.render());
    },

    undo: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, undoSnapshots, redoSnapshots } = getState();
        if (undoSnapshots.length <= 1) {
            return;
        }
        redoSnapshots.push(undoSnapshots.pop());
        const snapshots = undoSnapshots[undoSnapshots.length - 1];

        const modelState = modelGroup.undoRedo(snapshots.models);
        const toolPathModelState = toolPathModelGroup.undoRedo(snapshots.toolPathModels);

        dispatch(actions.updateState({
            ...modelState,
            ...toolPathModelState,
            undoSnapshots: undoSnapshots,
            redoSnapshots: redoSnapshots,
            canUndo: undoSnapshots.length > 1,
            canRedo: redoSnapshots.length > 0
        }));
        // dispatch(actions.showAllModelsObj3D(from));
        dispatch(actions.manualPreview());
        dispatch(actions.render());
    },

    redo: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, undoSnapshots, redoSnapshots } = getState();
        if (redoSnapshots.length === 0) {
            return;
        }

        undoSnapshots.push(redoSnapshots.pop());
        const snapshots = undoSnapshots[undoSnapshots.length - 1];

        const modelState = modelGroup.undoRedo(snapshots.models);
        const toolPathModelState = toolPathModelGroup.undoRedo(snapshots.toolPathModels);

        dispatch(actions.updateState({
            ...modelState,
            ...toolPathModelState,
            undoSnapshots: undoSnapshots,
            redoSnapshots: redoSnapshots,
            canUndo: undoSnapshots.length > 1,
            canRedo: redoSnapshots.length > 0
        }));
        // dispatch(actions.showAllModelsObj3D(from));
        dispatch(actions.manualPreview());
        dispatch(actions.render());
    },


    recordSnapshot: () => (dispatch, getState) => {
        const { modelGroup, toolPathModelGroup, undoSnapshots, redoSnapshots } = getState()[];
        const cloneModels = modelGroup.cloneModels();
        const cloneToolPathModels = toolPathModelGroup.cloneToolPathModels();
        undoSnapshots.push({
            models: cloneModels,
            toolPathModels: cloneToolPathModels
        });
        redoSnapshots.splice(0);
        dispatch(actions.updateState({
            undoSnapshots: undoSnapshots,
            redoSnapshots: redoSnapshots,
            canUndo: undoSnapshots.length > 1,
            canRedo: redoSnapshots.length > 0
        }));
    }
};


