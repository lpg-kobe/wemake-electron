/**
 * @desc all route will be registered by this file
 * @author pika
 */
import dynamic from 'dva/dynamic';
import { RouteConfigsType } from './utils/type'
// set default loading before component load
// dynamic.setDefaultLoadingComponent(Loading)
const RouteArrs: RouteConfigsType = [
  {
    path: '/',
    pathname: '启动连接',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/init/index'),
        // @ts-ignore
        models: () => []
      }),
  },
  {
    path: '/home',
    pathname: '打印首页',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/home/index'),
        // @ts-ignore
        models: () => [import('./models/home/index')]
      }),
  }
]

export default RouteArrs;
