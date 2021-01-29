import React from 'react';
import { Router, Route, Switch } from 'dva/router';
import CommonLayout from './components/layout';
import routes from './route.config';

type RouteType = {
  component: any;
  children: string[];
  path: string;
  exact: boolean;
};

/**
 * @desc main function to create router
 * @param {Object} route config of route
 * @param {Object} app dva app
 */
const createRoute = (route: RouteType, app: any) => {
  const { component, children, path, exact } = route;
  const Component = component(app);
  return (
    <Route
      key={Math.random().toString(36).substring(6)}
      path={path}
      exact={typeof exact === 'undefined' ? true : exact}
      component={Component}
    >
      {children &&
        children.map((ele: any) => {
          return createRoute(ele, app);
        })}
    </Route>
  );
};

function RouterConfig({ history, app }: any) {
  return (
    <Router history={history}>
      <Switch>
        <CommonLayout>
          <Switch>{routes.map((route: any) => createRoute(route, app))}</Switch>
        </CommonLayout>
      </Switch>
    </Router>
  );
}

export default RouterConfig;
