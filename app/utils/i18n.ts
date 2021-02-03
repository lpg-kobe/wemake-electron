/**
 * @desc main config of i18n
 * @author pika
 */

import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from "i18next";
import enUsTrans from "../../resources/locales/en-us.json";
import zhCnTrans from "../../resources/locales/zh-cn.json";
import {
  initReactI18next
} from 'react-i18next';

i18n.use(initReactI18next) 
.init({
  resources: {
    en: {
      translation: enUsTrans,
    },
    zh: {
      translation: zhCnTrans,
    },
  },
  // default lang of key in resources
  fallbackLng: "zh",
  debug: false,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
})

export default i18n;