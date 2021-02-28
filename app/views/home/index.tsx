import React from 'react';
import { connect } from 'dva';
import logger from "../../utils/log"
import CommonFooter from '../../components/layout/footer'
import PortBash from './components/portBash'
import ToolTips from './components/toolTips'
import RenderPanel from './components/renderPanel'
import ControllPanel from './components/controllPanel'

const wemakeLog = logger('______Home Page______')
const Home = () => {
  return (
    <>
      <section className="home-page-container flex">
        <div className="home-page-container-l">
          <PortBash />
        </div>
        <div className="home-page-container-r flex">
          <div className="fix-top">
            <ToolTips />
          </div>
          <div className="flex-bottom flex">
            <div className="bottom-l" style={{ background: `#${Math.floor(Math.random() * 16777215).toString(16)}` }}> <RenderPanel /></div>
            <div className="bottom-r">  <ControllPanel /></div>
          </div>
        </div>
      </section>
      <CommonFooter />
    </>

  );
};
export default connect(({ home, system }: any) => ({
  home: home.toJS(),
  system: system.toJS()
}))(Home)
