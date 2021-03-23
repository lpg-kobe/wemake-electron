import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import { Button, Select, Tag, Divider, Steps, Popover } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { exec } from 'child_process'
import path from 'path'
import logger from "../../utils/log"
import LaserController from '../../controllers/LaserController'
import { rendererInvoke, MAIN_EVENT } from '../../utils/ipc';
import { judgeRouterUrl, loopToInterval } from '../../utils/tool';
import { DEFAULT_WINDOW_SIZE, NODE_ENV, RESOURCES_PATH } from '../../constants';
import WemakeEvent from '../../utils/event';

const wemakeLog = logger('______Init Page______')
const Init = () => {
  const [serialports, setSerialports]: any = useState([])
  const [step, setStep]: any = useState(0)
  const [status, setStatus]: any = useState({
    check: 'wait',
    connect: 'wait',
    finish: 'wait'
  })

  const { t } = useTranslation()

  const isMac = process.platform === 'darwin'
  const command = isMac ? 'ls /System/Library/Extensions' : 'driverquery'
  const driverReg = isMac ? /.*usbserial.*/gi : /CH.*SER_A.*$/gi // 'CH341SER_A64'

  useEffect(() => {
    // check driver if exist
    exec(command, (error, stdout) => {
      if (error) {
        wemakeLog.info(`fail by node command exec:`, error)
        return
      }
      const isInstalled = stdout.match(driverReg)
      const isProduction = NODE_ENV === 'production'
      const driverPath = isProduction ? path.join(RESOURCES_PATH, '/cache') : path.join(__dirname, '../', 'resources')
      const openCommand = isMac ? `open ${path.join(driverPath, '/driver.pkg')}` : `${path.join(driverPath, '/driver.exe')}`
      if (isInstalled) {
        setStep(step + 1)
        setStatus({
          ...status,
          check: 'finish'
        })
        handleConnectSerialport()
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
        if (stdout.match(driverReg)) {
          setStep(step + 1)
          setStatus({
            ...status,
            check: 'finish'
          })
          handleConnectSerialport()
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  async function handleConnectSerialport() {
    const serial = new LaserController()
    const ports = await serial.listPort()
    const { serialport: { connected } } = WemakeEvent.event
    WemakeEvent.on(connected, () => {
      setStep((step: number) => step + 1)
      setStatus((status: any) => ({
        ...status,
        connect: 'finish'
      }))
      setTimeout(() => {
        rendererInvoke(MAIN_EVENT.MAIN_OPEN_PAGE, {
          ...DEFAULT_WINDOW_SIZE.MAIN,
          namespace: 'homeWindow',
          closeNamespace: 'initWindow',
          url: judgeRouterUrl('/home'),
        }, () => {
          wemakeLog.info('init success to go home page:')
        })
      }, 1000)
    })
    setSerialports(ports)
  }

  return (
    <div className="init-page-container main-container">
      <section>
        <Tag color="blue">{t('serialport')}:</Tag>
        <Select placeholder={t('serialport list')}>
          {
            serialports.map((ele: any) => <Select.Option key={ele.path}>{ele.name}</Select.Option>)
          }
        </Select>
        <Tag style={{ marginLeft: '10px' }} color="#f50">{t('inorder to make mechine work successfully,you must use this application by three steps')}</Tag>
      </section>
      <Divider orientation="left"></Divider>
      <section>
        <Steps current={step}>
          <Steps.Step status={status['check']} disabled icon={step === 0 ? <LoadingOutlined /> : null} title={t('detect drive')} description={t('find drive to install')} />
          <Steps.Step status={status['connect']} disabled icon={step === 1 ? <LoadingOutlined /> : null} title={t('connect port')} subTitle={`${t('connecting')}...`} description={`${t('ready to connect')}`} />
          <Steps.Step status={status['finish']} disabled icon={step === 2 ? <LoadingOutlined /> : null} title={t('finish connect')} description={t('connect finished to start')} />
        </Steps>
      </section>
      <Divider orientation="left"></Divider>
      <section>
        <div className="flex-between">
          <Popover content={<p>{t('connect us by email:501968942@qq.com')}</p>}><Button>{t('help')}</Button></Popover>
          <Button type="primary" disabled title={t('not support now')}>{t('connect by yourSelf')}</Button>
        </div>
      </section>
    </div>
  );
};
export default Init
