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
    pathname: 'Home',
    component: (app: any) =>
      dynamic({
        // @ts-ignore
        app,
        component: () => import('./views/home/index'),
        // @ts-ignore
        models: () => []
      }),
  }
]

export default RouteArrs;
