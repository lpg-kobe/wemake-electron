/**
 * @desc 公用标题栏组件
 */
import React, { ReactNode, useState } from 'react'
// @ts-ignore
import { isWindowMax, maxWindow, unMaxWindow, minWindow, closeWindow } from '@/utils/ipc'
import { TitleMenusType } from '../../utils/type'

import './style.less'

type PropsTypes = {
    children?: ReactNode;
    titleBarProps?: TitleMenusType // 要展示的窗口操作按钮
}

export default function TitleBar(props: PropsTypes) {
    const [fullScreen, setFullScreen] = useState(isWindowMax())

    /**
     * @desc handle click of titlebar btn
     * @param {String} type event type
     * @param {Function} click callback of click
     */
    function handleBtnClick({ type, click }: any) {
        const btnReact: any = {
            'refresh': () => location.reload(),
            'min': () => minWindow(),
            'max': () => {
                fullScreen ? unMaxWindow() : maxWindow()
                setFullScreen(!fullScreen)
            },
            'close': () => closeWindow()
        }
        click ? click(type) : btnReact[type] && btnReact[type]()
    }

    const {
        //@ts-ignore
        titleBarProps = titleBarProps || [{
            type: 'min',
            title: '最小化'
        }, {
            type: 'close',
            title: '关闭'
        }],
    } = props

    return <div className="title-bar-container">
        <div className="bar-l">
            {props.children}
        </div>
        <div className="bar-r">
            {
                titleBarProps && titleBarProps.map((btn: any, index: number) => btn.icon ? btn.icon : <i key={index} title={btn.title} className={`icon icon-${btn.type}-win`} onClick={() => handleBtnClick(btn)} />)
            }
        </div>
    </div>
}