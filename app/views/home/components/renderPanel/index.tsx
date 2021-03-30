import React, { Component } from 'react';
import * as THREE from 'three';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import { EPSILON } from '../../constants';
import controller from '../../lib/controller';
import { toFixed } from '../../lib/numeric-utils';
import i18n from '../../lib/i18n';
import ProgressBar from '../../components/ProgressBar';
import Space from '../../components/Space';
import ContextMenu from '../../components/ContextMenu';

import Canvas from '../../components/SMCanvas';
import PrintablePlate from '../CncLaserShared/PrintablePlate';
import SecondaryToolbar from '../CanvasToolbar/SecondaryToolbar';
import { actions } from '../../flux/cncLaserShared';
import VisualizerTopLeft from './VisualizerTopLeft';
import styles from './styles.styl';


function humanReadableTime(t) {
    const hours = Math.floor(t / 3600);
    const minutes = Math.ceil((t - hours * 3600) / 60);
    return (hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`);
}

const RenderPanel = () => {
    contextMenuRef = React.useRef();

    visualizerRef = React.useRef();

    printableArea = null;

    canvas = React.useRef();

    state = {
        progress: 0
    };

    actions = {
        // canvas footer
        zoomIn: () => {
            this.canvas.current.zoomIn();
        },
        zoomOut: () => {
            this.canvas.current.zoomOut();
        },
        autoFocus: () => {
            this.canvas.current.autoFocus();
        },
        onSelectModel: (model) => {
            this.props.selectModel(model);
        },
        onUnselectAllModels: () => {
            this.props.unselectAllModels();
        },
        onModelAfterTransform: () => {
            this.props.onModelAfterTransform();
        },
        onModelTransform: () => {
            this.props.onModelTransform();
        },
        // context menu
        bringToFront: () => {
            this.props.bringSelectedModelToFront();
        },
        sendToBack: () => {
            this.props.sendSelectedModelToBack();
        },
        onUpdateSelectedModelPosition: (position) => {
            this.props.onSetSelectedModelPosition(position);
        },
        deleteSelectedModel: () => {
            this.props.removeSelectedModel();
            this.setState({
                progress: 0
            });
        },
    };

    controllerEvents = {
        'task:completed': () => {
            this.setState({
                progress: 1.0
            });
        },
        'task:progress': (progress) => {
            if (Math.abs(progress - this.state.progress) > 0.05) {
                this.setState({
                    progress: progress
                });
            }
        }
    };

    constructor(props) {
        super(props);

        const size = props.size;
        this.printableArea = new PrintablePlate(size);
    }

    useEffect(() => {
        this.addControllerEvents();

        this.canvas.current.resizeWindow();
        this.canvas.current.disable3D();

        window.addEventListener(
            'hashchange',
            (event) => {
                if (event.newURL.endsWith('laser')) {
                    this.canvas.current.resizeWindow();
                }
            },
            false
        );
    }, [])

    componentWillReceiveProps(nextProps) {
        const { renderingTimestamp } = nextProps;

        if (!isEqual(nextProps.size, this.props.size)) {
            const size = nextProps.size;
            this.printableArea.updateSize(size);
        }

        this.canvas.current.updateTransformControl2D();
        const { selectedModelID } = nextProps;
        if (selectedModelID !== this.props.selectedModelID) {
            const selectedModel = this.props.getSelectedModel();
            if (!selectedModel) {
                this.canvas.current.controls.detach();
            } else {
                const sourceType = selectedModel.sourceType;
                if (sourceType === 'text') {
                    this.canvas.current.setTransformControls2DState({ enabledScale: false });
                } else {
                    this.canvas.current.setTransformControls2DState({ enabledScale: true });
                }
                const meshObject = selectedModel.meshObject;
                if (meshObject) {
                    this.canvas.current.controls.attach(meshObject);
                }
            }
        }

        if (renderingTimestamp !== this.props.renderingTimestamp) {
            this.canvas.current.renderScene();
        }
    }

    showContextMenu = (event) => {
        this.contextMenuRef.current.show(event);
    };

    addControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.on(eventName, callback);
        });
    }

    removeControllerEvents() {
        Object.keys(this.controllerEvents).forEach(eventName => {
            const callback = this.controllerEvents[eventName];
            controller.off(eventName, callback);
        });
    }

    render() {
        const isModelSelected = !!this.props.selectedModelID;
        const hasModel = this.props.hasModel;

        const estimatedTime = isModelSelected ? this.props.getEstimatedTime('selected') : this.props.getEstimatedTime('total');

        return (
            <div
                ref={this.visualizerRef}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            >
                <div className={styles['visualizer-top-left']}>
                    <VisualizerTopLeft />
                </div>
                <div className={styles['canvas-content']}>
                    <Canvas
                        ref={this.canvas}
                        size={this.props.size}
                        backgroundGroup={this.props.backgroundGroup}
                        modelGroup={this.props.modelGroup.object}
                        toolPathModelGroup={this.props.toolPathModelGroup.object}
                        printableArea={this.printableArea}
                        cameraInitialPosition={new THREE.Vector3(0, 0, 70)}
                        onSelectModel={this.actions.onSelectModel}
                        onUnselectAllModels={this.actions.onUnselectAllModels}
                        onModelAfterTransform={this.actions.onModelAfterTransform}
                        onModelTransform={this.actions.onModelTransform}
                        showContextMenu={this.showContextMenu}
                        transformSourceType="2D"
                    />
                </div>
                <!-- 
                <div className={styles['canvas-footer']}>
                    <SecondaryToolbar actions={this.actions} />
                </div>
                {estimatedTime && (
                    <div className={styles['visualizer-info']}>
                        {i18n._('Estimated Time:')}<Space width={4} />{humanReadableTime(estimatedTime)}
                    </div>
                )}

                {isModelSelected && (
                    <div className={styles['visualizer-notice']}>
                        {(this.state.progress < 1 - EPSILON) && (
                            <p>{i18n._('Generating tool path... {{progress}}%', { progress: toFixed(this.state.progress, 2) * 100.0 })}</p>
                        )}
                        {(this.state.progress > 1 - EPSILON) && (
                            <p>{i18n._('Generated tool path successfully.')}</p>
                        )}
                    </div>
                )}
                {isModelSelected && (
                    <div className={styles['visualizer-progress']}>
                        <ProgressBar progress={this.state.progress * 100.0} />
                    </div>
                )}
                -->
                <ContextMenu
                    ref={this.contextMenuRef}
                    id="laser"
                    menuItems={
                        [
                            {
                                type: 'item',
                                label: i18n._('Bring to Front'),
                                disabled: !isModelSelected,
                                onClick: this.actions.bringToFront
                            },
                            {
                                type: 'item',
                                label: i18n._('Send to Back'),
                                disabled: !isModelSelected,
                                onClick: this.actions.sendToBack
                            },
                            {
                                type: 'subMenu',
                                label: i18n._('Flip'),
                                disabled: !isModelSelected,
                                items: [
                                    {
                                        type: 'item',
                                        label: i18n._('Vertical'),
                                        onClick: () => this.props.onFlipSelectedModel('Vertical')
                                    },
                                    {
                                        type: 'item',
                                        label: i18n._('Horizontal'),
                                        onClick: () => this.props.onFlipSelectedModel('Horizontal')
                                    },
                                    {
                                        type: 'item',
                                        label: i18n._('Reset'),
                                        onClick: () => this.props.onFlipSelectedModel('Reset')
                                    }
                                ]
                            },
                            {
                                type: 'separator'
                            },
                            {
                                type: 'item',
                                label: i18n._('Delete Selected Model'),
                                disabled: !isModelSelected,
                                onClick: this.actions.deleteSelectedModel
                            }
                        ]
                    }
                />
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const machine = state.machine;

    const { background } = state.laser;
    const { selectedModelID, modelGroup, toolPathModelGroup, hasModel, renderingTimestamp } = state.laser;
    return {
        size: machine.size,
        hasModel,
        selectedModelID,
        modelGroup,
        toolPathModelGroup,
        // model,
        backgroundGroup: background.group,
        renderingTimestamp
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        getEstimatedTime: (type) => dispatch(actions.getEstimatedTime('laser', type)),
        getSelectedModel: () => dispatch(actions.getSelectedModel('laser')),
        bringSelectedModelToFront: () => dispatch(actions.bringSelectedModelToFront('laser')),
        sendSelectedModelToBack: () => dispatch(actions.sendSelectedModelToBack('laser')),
        arrangeAllModels2D: () => dispatch(actions.arrangeAllModels2D('laser')),
        // updateSelectedModelTransformation: (transformation) => dispatch(actions.updateSelectedModelTransformation('laser', transformation)),
        onSetSelectedModelPosition: (position) => dispatch(actions.onSetSelectedModelPosition('laser', position)),
        onFlipSelectedModel: (flip) => dispatch(actions.onFlipSelectedModel('laser', flip)),
        selectModel: (model) => dispatch(actions.selectModel('laser', model)),
        unselectAllModels: () => dispatch(actions.unselectAllModels('laser')),
        removeSelectedModel: () => dispatch(actions.removeSelectedModel('laser')),
        onModelTransform: () => dispatch(actions.onModelTransform('laser')),
        onModelAfterTransform: () => dispatch(actions.onModelAfterTransform('laser'))
    };
};

export default RenderPanel 
