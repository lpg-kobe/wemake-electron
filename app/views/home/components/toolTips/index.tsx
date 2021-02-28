/**
 * @desc tool panel for machine
 * @desc author pika
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'antd'
import FileReader from '../../../../components/fileReader'

const ToolTips = () => {
  const { t } = useTranslation()
  return <div className="tool-tips-cotainer flex-between">
    <div className="container-l">
      <Button size="small">{t('machine')}</Button>
      <FileReader options={{ trigger: <Button size="small">{t('folder of img')}</Button> }} />
    </div>
    <div className="container-r">
      <Button type="link">{t('guide')}</Button>
      <Button type="link">{t('help')}</Button>
    </div>

  </div>
}

export default ToolTips