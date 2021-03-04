import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import { Button, Select, Tag, Divider, Steps } from 'antd'
import { exec } from 'child_process'
import path from 'path'
import logger from "../../utils/log"
import { rendererInvoke, MAIN_EVENT } from '../../utils/ipc';
import { judgeRouterUrl, loopToInterval } from '../../utils/tool';
import { DEFAULT_WINDOW_SIZE, NODE_ENV, RESOURCES_PATH } from '../../constants';

const wemakeLog = logger('______Init Page______')
const Init = (props: any) => {

  const [serialports, setSerialports]: any = useState([])
  const [step, setStep]: any = useState(0)

  const { t } = useTranslation()

  const isMac = process.platform === 'darwin'
  const command = isMac ? 'ls /System/Library/Extensions' : 'driverquery'
  const driverName = isMac ? 'mac-os-x-driver' : 'setup-driver'

  useEffect(() => {
    // check driver if exist
    exec(command, (error, stdout) => {
      if (error) {
        wemakeLog.info(`fail by node command exec:`, error)
        return
      }
      const isInstalled = stdout.includes(driverName)
      const isProduction = NODE_ENV === 'production'
      const driverPath = isProduction ? path.join(RESOURCES_PATH, '/cache') : path.join(__dirname, '../', 'resources')
      const openCommand = isMac ? `open ${path.join(driverPath, '/driver.pkg')}` : `${path.join(driverPath, '/driver.exe')}`
      if (isInstalled) {
        setStep(step + 1)
      } else {
        exec(openCommand, (error) => {
          if (error) {
            wemakeLog.info(`fail by node command execFile:`, error)
            return
          }
          // loop to check if installed after open file of driver
          let timer: any = null
          timer = loopToInterval(checkDriver, timer, 3 * 1000)
        })
      }
    })
  }, [])

  function checkDriver() {
    return new Promise((resolve) => {
      exec(command, (error, stdout) => {
        if (error) {
          wemakeLog.info(`fail by loop to node command exec:`, error)
          resolve(false)
          return
        }
        if (stdout.includes(driverName)) {
          setStep(step + 1)
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  // rendererInvoke(MAIN_EVENT.MAIN_OPEN_PAGE, {
  //   ...DEFAULT_WINDOW_SIZE.MAIN,
  //   namespace: 'homeWindow',
  //   closeNamespace: 'initWindow',
  //   url: judgeRouterUrl('/home'),
  // }, () => {

  // })

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
        <Steps current={step} percent={100 / 3 * (step + 1)}>
          <Steps.Step disabled title={t('detect drive')} description={t('find drive to install')} />
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
