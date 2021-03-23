/**
 * @desc file reader to list all img in folder of app and clooect local img to folder
 * @author pika
 */

import React, { useRef, useState } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import fs from 'fs-extra'
import path from 'path'
import sharp from 'sharp'
import os from 'os'
import { PlusOutlined } from '@ant-design/icons'
import { NODE_ENV } from '../../constants'
import AModal from '../modal'
import logger from '../../utils/log'
import './style.less'

const imgFolder = NODE_ENV === 'production' ? path.join(os.tmpdir(), '/cache') : path.join(__dirname, '../', 'release/cache')
const imgPreffix = 'data:image/png;base64,'
const fileReg = ['jpeg', 'png', 'jpg']
const wemakeLogger = logger('______File Reader______')

const FileReader = (props: any) => {
  const { options } = props
  const { t } = useTranslation()
  const fileRef: any = useRef(null)
  const [visible, setVisible]: any = useState(false)
  const [fileList, setFiles]: any = useState([])

  /** click to select file in folder */
  function handleShowFiles() {
    fs.ensureDir(imgFolder, (err) => {
      if (err) {
        return
      }
      fs.readdir(imgFolder, (err, imgs: Array<any>) => {
        if (err) { return }
        imgs = imgs.filter((name: string) => fileReg.some(type => name.endsWith(type)))
        imgs.forEach((img: any) => {
          sharp(path.join(imgFolder, img)).resize(180).toBuffer().then((res: Buffer) => {
            setFiles((list: Array<string>) => [...list, `${imgPreffix}${res.toString('base64')}`])
          })
        })
      })
    })
    setVisible(true)
  }

  /** upload local file to folder */
  function handleFileUpload() {
    wemakeLogger.info('upload file:')
    fileRef.current.click()
  }

  /** handle change of select file */
  function handleFileChange({ target: { files } }: any) {
    const { path: filePath, name } = files[0]
    fs.copy(filePath, path.join(imgFolder, name)).then(() => {
      sharp(path.join(imgFolder, name)).resize(180).toBuffer().then((res: Buffer) => {
        setFiles([...fileList, `${imgPreffix}${res.toString('base64')}`])
      })
      wemakeLogger.info('success to add file to folder:', `${filePath}/${name}`)
    }, (err) => {
      wemakeLogger.info('faile to copy file:', `${filePath}/${name}`, err)
    })
  }

  const TriggerDom = options.trigger ? React.cloneElement(options.trigger, { onClick: handleShowFiles }) : <Button onClick={handleShowFiles}>{t('selectImg')}</Button>

  return <>
    {TriggerDom}
    <input type="file" accept="image/png, image/jpeg, image/jpg" hidden ref={fileRef} onChange={handleFileChange} />
    <AModal footer={null} visible={visible} width={520} onCancel={() => { setFiles([]); setVisible(false) }} className="img-card-modal">
      <ul>
        {
          fileList.length ?
            fileList.map((path: string) => <li className="list-item" key={Math.random()}><img src={path} /></li>) : null
        }
        <li className="list-item add" title={t('select img')} onClick={handleFileUpload}><PlusOutlined /></li>
      </ul>
    </AModal>
  </>
}

export default FileReader