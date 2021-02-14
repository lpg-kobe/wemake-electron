import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'
import serialport from 'serialport'
import { connect } from 'dva';

const Home = (props: any) => {
  const { home: { serialports }, system, dispatch } = props
  // const [serialports, setSerialports]: any = useState([])
  const { t } = useTranslation()
  useEffect(() => {
    getPorts()
  }, [])

  function getPorts() {
    console.log(system)
    // @TODO serialport data from socket, add socket connect
    serialport.list().then((ports: any, err: any) => {
      if (err) {
        return
      }
      dispatch({
        type: 'home/save',
        payload: {
          serialports: ports
        }
      })
    })
  }

  return (
    <div>
      <h1>Wemake</h1>
      <p>
        <label>{t('serialport')}:</label>
        <select>
          {
            serialports && serialports.map((port: any) => <option key={Math.random()} value={port.pnpId}>
              {port.path}
            </option>)
          }
        </select>
        <button onClick={getPorts}>refresh</button>
      </p>
      <div className="Hello">
        <a
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Read our docs
          </button>
        </a>
        <a
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              🙏
            </span>
            Donate
          </button>
        </a>
      </div>
    </div>
  );
};
export default connect(({ home, system }: any) => ({
  home: home.toJS(),
  system: system.toJS()
}))(Home)
