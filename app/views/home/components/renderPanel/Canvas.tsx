/**
 * Canvas
 *
 * Canvas is a React Component that is in charge of rendering models
 * on top of OpenGL and handles user interactions.
 */

import noop from 'lodash/noop';
import React, { Component } from 'react';
import { Vector3, Color, PerspectiveCamera, Scene, Group, HemisphereLight, WebGLRenderer } from 'three';
import Detector from 'three/examples/js/Detector';
import PropTypes from 'prop-types';
import TWEEN from '@tweenjs/tween.js';
import Controls, { EVENTS } from './Controls';
import { useTranslation } from 'react-i18next'

const ANIMATION_DURATION = 500;

const Canvas = (prop: any) => {
    const { t } = useTranslation()
    const node: any = useRef(null);

    controls = null;

    animationCount = 0;

    frameId = 0;

    initialTarget = new Vector3();

    const {
      backgroundGroup,
      printableArea,
      modelGroup,
      transformSourceType,
      toolPathModelGroup,
      gcodeLineGroup,
      cameraInitialPosition,
      onSelectModel,
      onUnselectAllModels,
      onModelAfterTransform,
      onModelTransform
    } = props;

    transformMode = 'translate'; // transformControls mode: translate/scale/rotate

    // controls
    msrControls = null; // pan/scale/rotate print area
    transformControls = null; // pan/scale/rotate selected model

    // threejs
    camera = null;
    renderer = null;
    scene = null;
    group = null;

    useEffect(() => {
        setupScene();
        setupControls();

        group.add(printableArea);
        printableArea.addEventListener('update', () => renderScene()); // TODO: another way to trigger re-render

        group.add(modelGroup);

        toolPathModelGroup && group.add(toolPathModelGroup);
        gcodeLineGroup && group.add(gcodeLineGroup);
        backgroundGroup && group.add(backgroundGroup);

        renderScene();

        window.addEventListener('resize', resizeWindow, false);
        return () => {
          if (controls) {
            controls.dispose();
          }
          msrControls && msrControls.dispose();
          transformControls && transformControls.dispose();
        }
    }, [])

    getVisibleWidth() {
        return node.current.parentElement.clientWidth;
    }

    getVisibleHeight() {
        return node.current.parentElement.clientHeight;
    }

    setupScene() {
        const width = getVisibleWidth();
        const height = getVisibleHeight();

        camera = new PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.copy(cameraInitialPosition);

        renderer = new WebGLRenderer({ antialias: true });
        renderer.setClearColor(new Color(0xfafafa), 1);
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;

        scene = new Scene();
        scene.add(camera);

        group = new Group();
        group.position.copy(DEFAULT_MODEL_POSITION);
        scene.add(group);

        scene.add(new HemisphereLight(0x000000, 0xe0e0e0));

        node.current.appendChild(renderer.domElement);
    }

    setupControls() {
        initialTarget.set(0, cameraInitialPosition.y, 0);

        const sourceType = props.transformSourceType === '2D' ? '2D' : '3D';

        controls = new Controls(sourceType, camera, group, renderer.domElement);

        controls.setTarget(initialTarget);
        controls.setSelectableObjects(modelGroup.children);

        controls.on(EVENTS.UPDATE, () => {
            renderScene();
        });
        controls.on(EVENTS.CONTEXT_MENU, (e) => {
            if (props.showContextMenu) {
                props.showContextMenu(e);
            }
        });
        controls.on(EVENTS.SELECT_OBJECT, (object) => {
            onSelectModel(object);
        });
        controls.on(EVENTS.UNSELECT_OBJECT, () => {
            onUnselectAllModels();
        });
        controls.on(EVENTS.TRANSFORM_OBJECT, () => {
            onModelTransform();
        });
        controls.on(EVENTS.AFTER_TRANSFORM_OBJECT, () => {
            onModelAfterTransform();
        });
    }

    setTransformMode(mode) {
        if (['translate', 'scale', 'rotate'].includes(mode)) {
            transformControls && transformControls.setMode(mode);

            controls && controls.setTransformMode(mode);
        }
    }

    setTransformControls2DState(params) {
        const { enabledTranslate, enabledScale, enabledRotate } = params;
        if (transformSourceType === '2D' && transformControls) {
            if (enabledTranslate !== undefined) {
                transformControls.setEnabledTranslate(enabledTranslate);
            }
            if (enabledScale !== undefined) {
                transformControls.setEnabledScale(enabledScale);
            }
            if (enabledRotate !== undefined) {
                transformControls.setEnabledRotate(enabledRotate);
            }
        }
    }

    animation = () => {
        frameId = window.requestAnimationFrame(animation);

        renderScene();
    };

    resizeWindow = () => {
        const width = getVisibleWidth();
        const height = getVisibleHeight();
        if (width * height !== 0) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        }

        renderScene();
    };

    zoomIn() {
        const object = { nonce: 0 };
        const to = { nonce: 20 };

        let lastNonce = 0;
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                if (object.nonce - lastNonce > 1) {
                    lastNonce = object.nonce;
                    controls.dollyIn();
                    controls.updateCamera();
                }
            });
        startTween(tween);
    }

    zoomOut() {
        const object = { nonce: 0 };
        const to = { nonce: 20 };

        let lastNonce = 0;
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                if (object.nonce - lastNonce > 1) {
                    lastNonce = object.nonce;
                    controls.dollyOut();
                    controls.updateCamera();
                }
            });
        startTween(tween);
    }

    autoFocus(model) {
        camera.position.copy(cameraInitialPosition);

        const target = model ? model.position.clone() : new Vector3(0, cameraInitialPosition.y, 0);
        controls.setTarget(target);

        const object = {
            positionX: camera.position.x,
            positionY: camera.position.y,
            positionZ: camera.position.z
        };
        const to = {
            positionX: props.cameraInitialPosition.x,
            positionY: props.cameraInitialPosition.y,
            positionZ: props.cameraInitialPosition.z
        };
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                camera.position.x = object.positionX;
                camera.position.y = object.positionY;
                camera.position.z = object.positionZ;

                // camera.lookAt(controls.target);
            });
        startTween(tween);
    }

    toLeft() {
        camera.rotation.x = 0;
        camera.rotation.z = 0;

        const object = {
            rotationY: camera.rotation.y
        };
        const dist = camera.position.distanceTo(controls.target);
        const to = {
            rotationY: Math.round(camera.rotation.y / (Math.PI / 2)) * (Math.PI / 2) - Math.PI / 2
        };
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                const rotation = object.rotationY;
                camera.rotation.y = rotation;

                camera.position.x = controls.target.x + Math.sin(rotation) * dist;
                camera.position.y = controls.target.y;
                camera.position.z = controls.target.z + Math.cos(rotation) * dist;
            });
        startTween(tween);
    }

    toRight() {
        camera.rotation.x = 0;
        camera.rotation.z = 0;

        const object = {
            rotationY: camera.rotation.y
        };
        const dist = camera.position.distanceTo(controls.target);
        const to = {
            rotationY: Math.round(camera.rotation.y / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 2
        };
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                const rotation = object.rotationY;
                camera.rotation.y = rotation;

                camera.position.x = controls.target.x + Math.sin(rotation) * dist;
                camera.position.y = controls.target.y;
                camera.position.z = controls.target.z + Math.cos(rotation) * dist;
            });
        startTween(tween);
    }

    toTop() {
        camera.rotation.y = 0;
        camera.rotation.z = 0;

        const object = {
            rotationX: camera.rotation.x
        };
        const dist = camera.position.distanceTo(controls.target);
        const to = {
            rotationX: Math.round(camera.rotation.x / (Math.PI / 2)) * (Math.PI / 2) - Math.PI / 2
        };
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                const rotation = object.rotationX;
                camera.rotation.x = rotation;

                camera.position.x = controls.target.x;
                camera.position.y = controls.target.y - Math.sin(rotation) * dist;
                camera.position.z = controls.target.z + Math.cos(rotation) * dist;
            });
        startTween(tween);
    }

    toBottom() {
        camera.rotation.y = 0;
        camera.rotation.z = 0;

        const object = {
            rotationX: camera.rotation.x
        };
        const dist = camera.position.distanceTo(controls.target);
        const to = {
            rotationX: Math.round(camera.rotation.x / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 2
        };
        const tween = new TWEEN.Tween(object)
            .to(to, ANIMATION_DURATION)
            .onUpdate(() => {
                const rotation = object.rotationX;
                camera.rotation.x = rotation;

                camera.position.x = controls.target.x;
                camera.position.y = controls.target.y - Math.sin(rotation) * dist;
                camera.position.z = controls.target.z + Math.cos(rotation) * dist;
            });
        startTween(tween);
    }

    enable3D() {
        controls.enableRotate = true;
    }

    disable3D() {
        controls.enableRotate = false;
    }

    updateTransformControl2D() {
        transformSourceType === '2D' && transformControls && transformControls.updateGizmo();
    }

    startTween(tween) {
        tween.onComplete(() => {
            animationCount--;
            animationCount = Math.max(animationCount, 0); // TODO: tween bug that onComplete called twice
            if (animationCount === 0) {
                window.cancelAnimationFrame(frameId);
            }
        });
        tween.start();

        animationCount++;
        if (animationCount === 1) {
            animation();
        }
    }

    renderScene() {
        renderer.render(scene, camera);

        TWEEN.update();
    }

    render() {
        if (!Detector.webgl) {
            return null;
        }
        return (
            <div
                ref={node}
                style={{
                    backgroundColor: '#eee'
                }}
            />
        );
    }
}

export default Canvas
