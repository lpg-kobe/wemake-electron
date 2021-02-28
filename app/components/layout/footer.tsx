/**
 * @desc common footer
 */

import React from 'react'
import { Layout, Progress } from 'antd'
import './style.less'

function CommonFooter() {
  const { Footer } = Layout
  return < Footer id="commonFooter">
    <Progress percent={50} status="active" />
  </ Footer>
}

export default CommonFooter