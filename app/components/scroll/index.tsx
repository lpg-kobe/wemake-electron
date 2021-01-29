/**
 * @desc 通用可监听滚动组件 @TODO
 */
import React from 'react'
// @ts-ignore
import { tottle } from '@/utils/tool'
export default function ScrollElement(props: any) {
    const { target, onReachTop, children } = props
    // 滚动跟随屏幕帧率刷新
    function animateToScroll() {
        const scrollTop = target.scrollTop
        if (scrollTop <= 0) {
            onReachTop && onReachTop()
        }
    }
    const ScrollDom = children
    return (<ScrollDom onScroll={() => tottle(animateToScroll)}></ScrollDom>)
}