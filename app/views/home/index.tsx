import React, { useEffect } from 'react';
import { connect } from 'dva';
import logger from "../../utils/log"
import CommonFooter from '../../components/layout/footer'
import PortBash from './components/portBash'
import ToolTips from './components/toolTips'
import RenderPanel from './components/renderPanel'
import ControllPanel from './components/controllPanel'
import LaserController from '@/controllers/LaserController'
import { EVENT } from '../../utils/event';

const wemakeLog = logger('______Home Page______')

const Home = (props: any) => {
  const { system: { clientIo } } = props
  useEffect(() => {
    new LaserController()
  }, [])

  useEffect(() => {
    if (!clientIo) { return }
    const { gcode: { data } } = EVENT
    clientIo.on(data, () => { })
  }, [clientIo])

  return (
    <>
      <section className="home-page-container flex">
        <div className="home-page-container-l">
          <button onClick={() => props.dispatch({
            type: 'home/gcodeSplit',
            payload: {}
          })}>gcodeSplit</button>
          <PortBash {...props} />
        </div>
        <div className="home-page-container-r flex">
          <div className="fix-top">
            <ToolTips {...props} />
          </div>
          <div className="flex-bottom flex">
            <div className="bottom-l" style={{ background: `#${Math.floor(Math.random() * 16777215).toString(16)}` }}>
              <RenderPanel {...props} />
            </div>
            <div className="bottom-r">
              <ControllPanel {...props} />
            </div>
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
