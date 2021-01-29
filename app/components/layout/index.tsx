import React, { ReactNode, Fragment } from 'react';
import { connect } from 'dva';
import { ConfigProvider } from 'antd'
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import zhCN from 'antd/lib/locale/zh_CN';

type PropsType = {
  children: ReactNode;
};

type MapStateType = {
  [key: string]: any;
};

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

function Layout(props: PropsType) {
  const { children } = props;
  return (
    <AppContainer>
      <ConfigProvider locale={zhCN}>
        {children}
      </ConfigProvider>
    </AppContainer>
  );
}
export default connect(({ system }: MapStateType) => ({
  system: system.toJS(),
}))(Layout);
