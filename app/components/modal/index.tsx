/**
 * @desc 公用modal模态窗控件，基于antd Modal
 */

import React from 'react'
import { Modal } from 'antd'
import { ModalProps } from 'antd/es/modal/Modal'
import Draggable from 'react-draggable';

interface PropsType extends ModalProps {
    draggable?: boolean;// 是否支持拖拽
    children?: any; // 子组件
    className?: string; // class
}

export default function AModal(props: PropsType) {
    const { draggable, children, className } = props
    return <Modal
        className={`ofweek-modal ${className || ''}`}
        destroyOnClose
        width={900}
        modalRender={
            (modal: any) => draggable ? <Draggable>{modal}</Draggable> : modal
        }
        centered={true}
        {...props}>
        {children}
    </Modal>
}