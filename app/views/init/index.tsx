import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { Button, Select, Tag, Divider, Steps } from 'antd'
import logger from "../../utils/log"
import { rendererInvoke, MAIN_EVENT } from '../../utils/ipc';
import { judgeRouterUrl } from '../../utils/tool';
import { DEFAULT_WINDOW_SIZE } from '../../constants';

const log = logger('______Init Page______')
const Init = (props: any) => {
  const [serialports, setSerialports]: any = useState([])
  const { t } = useTranslation()
  setTimeout(() => {
    rendererInvoke(MAIN_EVENT.MAIN_OPEN_PAGE, {
      ...DEFAULT_WINDOW_SIZE.MAIN,
      namespace: 'homeWindow',
      closeNamespace: 'initWindow',
      url: judgeRouterUrl('/home'),
    }, () => {

    })
  }, 3000)

  return (
    <div className="init-page-container main-container">
      <section>
        <Tag color="blue">{t('serialport')}:</Tag>
        <Select placeholder={t('serialport list')}>
          {
            serialports.map((ele: any) => <Select.Option>{ele.name}</Select.Option>)
          }
        </Select>
        <Tag style={{ marginLeft: '10px' }} color="#f50">{t('inorder to make mechine work successfully,you must use this application by three steps')}</Tag>
      </section>
      <Divider orientation="left"></Divider>
      <section>
        <Steps current={1} percent={60}>
          <Steps.Step disabled status="wait" title={t('detect drive')} description={t('find drive to install')} />
          <Steps.Step disabled title={t('connect port')} subTitle={t('connecting')} description={t('ready to connect...')} />
          <Steps.Step disabled title={t('finish connect')} description={t('connect finished to start')} />
        </Steps>
      </section>
      <Divider orientation="left"></Divider>
      <section>
        <div className="flex-between">
          <Button>{t('help')}</Button>
          <Button type="primary">{t('connect by yourSelf')}</Button>
        </div>
      </section>
    </div>
  );
};
export default Init
