/**
 * @desc file reader to list all img in folder of app and clooect local img to folder
 * @author pika
 */

import React, { useState } from 'react'
import { Button } from 'antd'
import { useTranslation } from 'react-i18next'
import fs from 'fs-extra'
import path from 'path'
import sharp from 'sharp'
import AModal from '../modal'
import logger from '../../utils/log'

const wemakeLogger = logger('File Reader')

const FileReader = () => {
  const { t } = useTranslation()
  const [visible, setVisible]: any = useState(false)
  const [files, setFiles]: any = useState([])

  function handleSelectFile() {
    wemakeLogger.info('Select Img')

    const imgFolder = path.resolve(__dirname, 'release/cache')
    const fileReg = ['jpeg', 'png', 'jpg']
    fs.ensureDir(imgFolder, (err) => {
      if (err) {
        return
      }
      fs.readdir(imgFolder, (err, files: Array<any>) => {
        if (err) { return }
        const imgPreffix = 'data:image/png;base64,'
        files = files.filter((name: string) => fileReg.some(type => name.endsWith(type)))
        files.forEach((file: any) => {
          sharp(path.join(imgFolder, file)).resize(180).toBuffer().then((res: Buffer) => {
            setFiles([...files, `${imgPreffix}${res.toString('base64')}`])
          })
        })
      })
    })
    setVisible(true)
  }

  return <>
    <Button onClick={handleSelectFile}>{t('selectImg')}</Button>
    <AModal footer={null} visible={visible} width={520} onCancel={() => setVisible(false)}>
      {
        files.length && files.map((path: string) => <img key={Math.random()} src={path} />)
      }
    </AModal>
  </>
}

export default FileReader