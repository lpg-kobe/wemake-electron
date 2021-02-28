/**
 * @desc controll panel for machine
 * @desc author pika
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Radio, Slider, Tag } from 'antd'
import FileReader from '../../../../components/fileReader'

const ControllPanel = () => {
  const { t } = useTranslation()
  return <div className="controll-panel-cotainer">
    <p><FileReader options={{ trigger: <Button type="primary">{t('open img / folder')}</Button> }} /></p>
    <p className="controll-line"><Button>{t('add text')}</Button></p>
    <p className="controll-line" style={{ margin: '10px 0' }}>
      <Button style={{ marginRight: '2px' }} type="primary">{t('start')}</Button>
      <Button style={{ marginRight: '2px' }} danger>{t('pass')}</Button>
      <Button danger type="primary">{t('stop')}</Button>
    </p>
    <p>
      <Button style={{ marginBottom: '2px', width: '68px' }}>{t('top')}</Button>
    </p>
    <p>
      <Button style={{ marginRight: '2px', width: '68px' }}>{t('left')}</Button>
      <Button style={{ marginRight: '2px', width: '68px' }}>{t('border')}</Button>
      <Button style={{ width: '68px' }}>{t('right')}</Button>
    </p>
    <p>
      <Button style={{ marginTop: '2px', width: '68px' }}>{t('bottom')}</Button>
    </p>
    <p style={{ marginTop: '20px' }}>
      <Tag color="blue" style={{ marginRight: '5px', lineHeight: '16px', padding: '0 5px' }}>{t('dot speed')}:</Tag>
      <Radio.Group value={0.1}>
        <Radio value={0.1}>0.1</Radio>
        <Radio value={1}>1</Radio>
        <Radio value={10}>10</Radio>
      </Radio.Group>
    </p>
    <p>
      <Button style={{ margin: '24px 0', width: '120px' }}>{t('setting')}</Button>
    </p>
    <p style={{ marginTop: '52px' }}>
      <Slider defaultValue={30} tooltipVisible tipFormatter={(value: any) => `激光功率${value}%`} />
    </p>
    <p style={{ marginTop: '52px' }}>
      <Slider defaultValue={30} tooltipVisible tipFormatter={(value: any) => `灼燒時間${value}ms`} />
    </p>
  </div>
}

export default ControllPanel