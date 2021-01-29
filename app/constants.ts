/**
 * @desc global config during electron
 */

import path from 'path'

type DefaultConfigParam = {
    show?: boolean;
    width?: number;
    height?: number;
    backgroundColor?: string;
    webPreferences?: any;
    maximizable?: boolean;
    minimizable?: boolean;
    websecurity?: boolean;// 同源策略
    resizable?: boolean; // 是否支持调整大小
    titleBarStyle?: any;// 隐藏标题栏窗口
    transparent?: boolean;// 透明窗口?
    frame?: boolean; // 带边框窗口?
    hasShadow?: boolean; // 带阴影窗口?
    icon?: string; // 窗口icon
    url?: string; // 开启的窗口url
    skipTaskbar?: boolean // 窗口icon
};

export const SDK_APP_ID: any = process.env.sdkAppId;
export const API_HOST: any = process.env.apiHost;
export const FACE_URL: any = process.env.faceUrl;

// 默认打开的窗口配置
export const DEFAULT_WINDOW_CONFIG: DefaultConfigParam = {
    websecurity: false,
    show: true,
    hasShadow: true,
    maximizable: true,
    minimizable: true,
    resizable: false,
    // titleBarStyle: 'hidden',
    // transparent: true,
    // frame: false,
    width: 740,
    height: 406,
    webPreferences:
        (process.env.NODE_ENV === 'development' ||
            process.env.E2E_BUILD === 'true') &&
            process.env.ERB_SECURE !== 'true'
            ? {
                nodeIntegration: true,
            }
            : {
                nodeIntegration: true,
                // preload: path.join(__dirname, 'dist/renderer.prod.js'),
            },
}

// 默认窗口大小
export const DEFAULT_WINDOW_SIZE = {
    // 主窗口||二级窗口
    MAIN: {
        width: 1280,
        height: 720
    },
    // 启动缓冲窗口
    LAUNCH: {
        width: 700,
        height: 450
    },
    // 登录窗口
    LOGIN: {
        width: 740,
        height: 406
    }
}