/**
 * @desc 通用自动匹配换行符纯展示组件
 */
import React from 'react'
// @ts-ignore
import { filterBreakWord } from '@/utils/tool'

interface Options {
    container?: string, // 包裹容器，默认p
    text: string, // 包裹内容
}

type PropsParam = {
    options: Options,
    className?: string
}

export default function BreakWord(props: PropsParam) {
    let { options: { container, text }, ...attrs } = props
    container = container || 'p'
    return <>
        {
            React.createElement(container, {
                dangerouslySetInnerHTML: {
                    __html: filterBreakWord(text)
                },
                ...attrs
            })
        }
    </>
}
