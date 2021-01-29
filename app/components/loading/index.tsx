/**
 * @desc common loading @TODO
 */

import React from 'react'
import './style.less'

interface PropsType {
    options: {
        mask?: boolean // 是否需要遮罩
    }
}

export default function OfweekLoading(props: PropsType) {
    const { options } = props
    const defaultOpts = {
        mask: true
    }
    const setting = { ...defaultOpts, options }
    const { mask } = setting

    return <div className="ofweek-loading">
        {mask && <div className="loading-mask" />}
        <div className="loader loader--fade">
            <span className="loader-item"></span>
            <span className="loader-item"></span>
            <span className="loader-item"></span>
            <span className="loader-item"></span>
            <span className="loader-item"></span>
            <span className="loader-item"></span>
        </div>
    </div>
}