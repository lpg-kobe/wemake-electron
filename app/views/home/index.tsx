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
import { gcodeSplit } from '../../services/api';

const wemakeLog = logger('______Home Page______')

const Home = (props: any) => {
  const { system: { clientIo }, dispatch } = props
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
          <button onClick={() => gcodeSplit(dispatch).then((res: any) => { console.log(res) })}>gcodeSplit demo</button>
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

// state for home modal
const mapStateToProps = (state) => {
  const machine = state.machine;

  const { background } = state.laser;
  const { selectedModelID, modelGroup, toolPathModelGroup, hasModel, renderingTimestamp } = state.laser;
  return {
    size: machine.size,
    hasModel,
    selectedModelID,
    modelGroup,
    toolPathModelGroup,
    // model,
    backgroundGroup: background.group,
    renderingTimestamp
  };
};

const mapDispatchToProps = (dispatch: () => void) => {
  return {
    // for RenderPanel
    // 获取运行完毕gcode的耗时
    getEstimatedTime: (type: string) => dispatch(actions.getEstimatedTime(type)),
    // 获取鼠标击中的图片
    getSelectedModel: () => dispatch(actions.getSelectedModel()),
    // 鼠标右键功能: 选中的图片在顶层展示
    bringSelectedModelToFront: () => dispatch(actions.bringSelectedModelToFront()),
    // 鼠标右键功能: 选中的图片在底层展示
    sendSelectedModelToBack: () => dispatch(actions.sendSelectedModelToBack()),

    //onSetSelectedModelPosition: (position) => dispatch(actions.onSetSelectedModelPosition(position)),
    // 翻转图片
    onFlipSelectedModel: (flip) => dispatch(actions.onFlipSelectedModel(flip)),
    // 选中图片 
    selectModel: (model) => dispatch(actions.selectModel(model)),
    // 取消选中任何图片，左键点击非图片区域触发 
    unselectAllModels: () => dispatch(actions.unselectAllModels()),
    // 鼠标右键功能: 删除选中的图片
    removeSelectedModel: () => dispatch(actions.removeSelectedModel()),
    // 鼠标控制图片操作(平移、放大/缩小、旋转)后，更新state.transfromation, 供ui展示
    onModelTransform: () => dispatch(actions.onModelTransform()),

    // for ControllPanel
    // 插入文字功能
    insertDefaultTextVector: () => dispatch(actions.insertDefaultTextVector('laser')),
    // 更新图片的size、平移、放大/缩小、旋转
    updateSelectedModelTransformation: (params) => dispatch(actions.updateSelectedModelTransformation('laser', params)),
    // 更新图片的gcodeconfig
    updateSelectedModelGcodeConfig: (params) => dispatch(actions.updateSelectedModelGcodeConfig('laser', params)),
    // 更新文字的config
    updateSelectedModelTextConfig: (config) => dispatch(actions.updateSelectedModelTextConfig('laser', config)),
    // 更新打印顺序
    updateSelectedModelPrintOrder: (printOrder) => dispatch(actions.updateSelectedModelPrintOrder('laser', printOrder)),
    // 计算图片的包围盒
    onModelAfterTransform: () => dispatch(actions.onModelAfterTransform('laser')),
    // (key,value)格式的gcode 转化为标准的gcode
    generateGcode: () => dispatch(actions.generateGcode('laser')),
    //addGcode: (name, gcode, renderMethod) => dispatch(workspaceActions.addGcode(name, gcode, renderMethod)),
    //clearGcode: () => dispatch(workspaceActions.clearGcode()),
    //生成(key,value)格式的gcode并做展示
    manualPreview: () => dispatch(actions.manualPreview('laser', true)),

    // props in render panel
    arrangeAllModels2D: () => dispatch(actions.arrangeAllModels2D('laser')),
    // updateSelectedModelTransformation: (transformation) => dispatch(actions.updateSelectedModelTransformation('laser', transformation)),
    onSetSelectedModelPosition: (position: any) => dispatch(actions.onSetSelectedModelPosition('laser', position))
  };
};

export default connect(({ home, system }: any) => ({
  home: home.toJS(),
  system: system.toJS()
}), mapDispatchToProps)(Home)
