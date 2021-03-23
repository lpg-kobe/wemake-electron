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
    <p><FileReader options={{ trigger: <Button type="primary" title={t('open img / folder')}>{t('open img / folder')}</Button> }} /></p>
    <p className="controll-line" title={t('add text')}><Button>{t('add text')}</Button></p>
    <p className="controll-line" style={{ margin: '10px 0' }}>
      <Button style={{ marginRight: '2px' }} type="primary" title={t('start to print')}>{t('start')}</Button>
      <Button style={{ marginRight: '2px' }} danger title={t('pass and let your machine have a rest')}>{t('pass')}</Button>
      <Button danger type="primary" title={t('this will stop your machine, click to sure')}>{t('stop')}</Button>
    </p>
    <p>
      <Button style={{ marginBottom: '2px', width: '68px' }} title={t('move laser forward top')}>{t('top')}</Button>
    </p>
    <p>
      <Button style={{ marginRight: '2px', width: '68px' }} title={t('move laser forward top')}>{t('left')}</Button>
      <Button style={{ marginRight: '2px', width: '68px' }} title={t('run laser around border of print target')}>{t('around')}</Button>
      <Button style={{ width: '68px' }} title={t('move laser forward right')}>{t('right')}</Button>
    </p>
    <p>
      <Button style={{ marginTop: '2px', width: '68px' }} title={t('move laser forward bottom')}>{t('bottom')}</Button>
    </p>
    <p style={{ marginTop: '20px' }} title={t('set dot speed of print machine by this')}>
      <Tag color="blue" style={{ marginRight: '5px', lineHeight: '16px', padding: '0 5px' }}>{t('dot speed')}:</Tag>
      <Radio.Group value={0.1}>
        <Radio value={0.1}>0.1</Radio>
        <Radio value={1}>1</Radio>
        <Radio value={10}>10</Radio>
      </Radio.Group>
    </p>
    <p>
      <Button style={{ margin: '24px 0', width: '120px' }} title={t('setting')}>{t('setting')}</Button>
    </p>
    <p style={{ marginTop: '52px' }} title={t('this can set power of laser during printing')}>
      <Slider defaultValue={30} tooltipVisible tipFormatter={(value: any) => `${t('power of laser')}：${value}%`} />
    </p>
    <p style={{ marginTop: '52px' }} title={t('this can set how long your laser stay during printing')}>
      <Slider defaultValue={30} tooltipVisible tipFormatter={(value: any) => `${t('time of laser stay')}：${value}ms`} />
    </p>
  </div>
}

export default ControllPanel