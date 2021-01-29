/**
 * @desc ts公用导出type
 */

import { DvaOption, Effect, Model } from 'dva'

export type DvaOptType = DvaOption;
export type DvaModelType = Model;
export type EffectType = Effect;

// 单个窗口按钮
export type TitleMenuType = {
    type: string,
    click?: any
}

// 窗口按钮菜单集群
export type TitleMenusType = Array<TitleMenuType>

// layout头部单个按钮
export type HeaderBtnType = {
    key: string,
    value: any
}

// layout头部按钮集群
export type HeaderBtnsType = Array<HeaderBtnType>

// sidebar 左侧菜单栏
export type SidebarType = {
    key: string,
    value: any
}

export type SidebarsType = Array<SidebarType>

// im消息推送单体
export type MsgReceiveType = {
    eventCode: string // 订阅事件名称,
    data: Array<any> // 接收到的消息推送数组
}

// 路由配置单体
export interface RouteConfigType {
    path: string; // route path
    pathname: string; // path name 
    component(app: any): void; // route component
}

// 路由配置
export type RouteConfigsType = Array<RouteConfigType>

