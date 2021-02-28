/**
 * @desc port bash panel for machine
 * @desc author pika
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Tag } from 'antd'

const PortBash = () => {
  const { t } = useTranslation()
  return <div className="port-bash-cotainer">
    <p>
      <Tag color="green" style={{ lineHeight: '16px' }}>{t('current port of connecting')}:</Tag>
      <label>{Math.random().toFixed(2)}</label>
    </p>
    <p style={{ margin: '5px 0' }}>
      <Tag color="green" style={{ lineHeight: '16px' }}>{t('modal of machine')}:</Tag>
      <label>wemake</label>
    </p>
    <div className="bash-info" style={{ background: '#000', height: '320px', color: '#fff' }}>
      CDM BASH
    </div>
  </div>
}

export default PortBash