import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import serialport from 'serialport'
import { connect } from 'dva';
import { Button, Select } from 'antd'
import logger from "../../utils/log"
import FileReader from "../../components/fileReader"

const log = logger('home page')
const Home = () => {
  const [serialports, setSerialports]: any = useState([])
  const { t } = useTranslation()
  useEffect(() => {
    log.info('render home page', { params: {} })
    getPorts()
  }, [])

  function getPorts() {
    // @TODO serialport data from socket, add socket connect
    serialport.list().then((ports: any, err: any) => {
      if (err) {
        return
      }
      setSerialports(ports)
    })
  }

  return (
    <div>
      <h1>Wemake</h1>
      <label>{t('serialport')}:</label>
      <Select value={0}>
        {
          serialports && serialports.map((port: any) => <Select.Option key={Math.random()} value={port.pnpId}>
            {port.path}
          </Select.Option>)
        }
      </Select>
      <Button onClick={getPorts} type="primary">refresh</Button>
      <FileReader />
    </div>
  );
};
export default connect(({ home, system }: any) => ({
  home: home.toJS(),
  system: system.toJS()
}))(Home)
