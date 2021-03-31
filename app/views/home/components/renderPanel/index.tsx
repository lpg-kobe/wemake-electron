import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { EPSILON } from '../../constants';
import controller from '../../lib/controller';
// @ts-ignore
import ContextMenu from '@/components/contextMenu';
// import ProgressBar from '../../components/ProgressBar';
import Canvas from './Canvas';
import { useTranslation } from 'react-i18next'
// import PrintablePlate from '../CncLaserShared/PrintablePlate';

const RenderPanel = (props: any) => {
    const { t } = useTranslation()
    const {
        size,
        modelGroup,
        backgroundGroup,
        toolPathModelGroup,
        unselectAllModels,
        selectedModelID,
        selectModel,
        getSelectedModel,
        getEstimatedTime,
        removeSelectedModel,
        onFlipSelectedModel,
        renderingTimestamp,
        bringSelectedModelToFront,
        sendSelectedModelToBack
    } = props

    const machineArea = size.x * size.y
    const controllerEvents: any = {
        'task:completed': () => {
            setProgress(0)
        },
        'task:progress': (pro: number) => {
            if (Math.abs(pro - progress) > 0.05) {
                setProgress(pro)
            }
        }
    };

    const contextMenuRef: any = useRef(null);
    const visualizerRef: any = useRef(null);
    const canvas: any = useRef(null);
    const [printableArea, setPrintableArea]: any = useState(null)
    const [progress, setProgress]: any = useState(null)

    function humanReadableTime(t: number) {
        const hours = Math.floor(t / 3600);
        const minutes = Math.ceil((t - hours * 3600) / 60);
        return (hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`);
    }

    function addControllerEvents() {
        Object.keys(controllerEvents).forEach(eventName => {
            const callback = controllerEvents[eventName];
            controller.on(eventName, callback);
        });
    }

    function onModelAfterTransform() {
        onModelAfterTransform();
    }

    function onModelTransform() {
        onModelTransform();
    }

    function deleteSelectedModel() {
        removeSelectedModel();
        setProgress(0);
    }

    useEffect(() => {
        // do sth once x&y change of machine
        // setPrintableArea(new PrintablePlate(size))
        printableArea.updateSize(size);
    }, [size.x])

    useEffect(() => {
        // do sth once x&y change of machine
        // setPrintableArea(new PrintablePlate(size))
        printableArea.updateSize(size);
    }, [size.y])

    useEffect(() => {
        addControllerEvents();
        canvas?.current?.resizeWindow();
        canvas?.current?.disable3D();
        return () => {
            removeControllerEvents()
        }
    }, [])

    useEffect(() => {
        canvas.current.renderScene()
        // canvas.current.updateTransformControl2D();  sure to del.
    }, [renderingTimestamp])

    useEffect(() => {
        const selectedModel = getSelectedModel();
        if (!selectedModel) {
            canvas.current.controls.detach();
        } else {
            const sourceType = selectedModel.sourceType;
            if (sourceType === 'text') {
                canvas.current.setTransformControls2DState({ enabledScale: false });
            } else {
                canvas.current.setTransformControls2DState({ enabledScale: true });
            }
            const meshObject = selectedModel.meshObject;
            if (meshObject) {
                canvas.current.controls.attach(meshObject);
            }
        }
    }, [selectedModelID])

    function showContextMenu(event: any) {
        contextMenuRef?.current?.show(event);
    };

    function removeControllerEvents() {
        Object.keys(controllerEvents).forEach(eventName => {
            const callback = controllerEvents[eventName];
            controller.off(eventName, callback);
        });
    }

    const isModelSelected = !!selectedModelID;
    const estimatedTime = isModelSelected ? getEstimatedTime('selected') : getEstimatedTime('total');

    return (
        <div
            ref={visualizerRef}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        >
            <div className='canvas-content'>
                <Canvas
                    ref={canvas}
                    size={size}
                    backgroundGroup={backgroundGroup}
                    modelGroup={modelGroup.object}
                    toolPathModelGroup={toolPathModelGroup.object}
                    printableArea={printableArea}
                    cameraInitialPosition={new THREE.Vector3(0, 0, 70)}
                    onSelectModel={(model: any) => selectModel(model)}
                    onUnselectAllModels={unselectAllModels}
                    onModelAfterTransform={onModelAfterTransform}
                    onModelTransform={onModelTransform}
                    showContextMenu={showContextMenu}
                    transformSourceType="2D"
                />
            </div>
            {estimatedTime && (
                <div className='visualizer-info'>
                    {t('Estimated Time：')}{humanReadableTime(estimatedTime)}
                </div>
            )}

            {isModelSelected && (
                <div className='visualizer-notice'>
                    {(progress < 1 - EPSILON) && (
                        <p>{t('Generating gcode... {{progress}}%')}</p>
                    )}
                    {(progress > 1 - EPSILON) && (
                        <p>{t('Generated gcode successfully.')}</p>
                    )}
                </div>
            )}
            {isModelSelected && (
                <div className='visualizer-progress'>
                    {/* <ProgressBar progress={progress * 100} /> */}
                </div>
            )}
            <ContextMenu
                ref={contextMenuRef}
                id="laser"
                menuItems={
                    [
                        {
                            type: 'item',
                            label: t('Bring to Front'),
                            disabled: !isModelSelected,
                            onClick: bringSelectedModelToFront
                        },
                        {
                            type: 'item',
                            label: t('Send to Back'),
                            disabled: !isModelSelected,
                            onClick: sendSelectedModelToBack
                        },
                        {
                            type: 'subMenu',
                            label: t('Flip'),
                            disabled: !isModelSelected,
                            items: [
                                {
                                    type: 'item',
                                    label: t('Vertical'),
                                    onClick: () => onFlipSelectedModel('Vertical')
                                },
                                {
                                    type: 'item',
                                    label: t('Horizontal'),
                                    onClick: () => onFlipSelectedModel('Horizontal')
                                },
                                {
                                    type: 'item',
                                    label: t('Reset'),
                                    onClick: () => onFlipSelectedModel('Reset')
                                }
                            ]
                        },
                        {
                            type: 'separator'
                        },
                        {
                            type: 'item',
                            label: t('Delete Selected Model'),
                            disabled: !isModelSelected,
                            onClick: deleteSelectedModel
                        }
                    ]
                }
            />
        </div>
    );
}

export default RenderPanel
