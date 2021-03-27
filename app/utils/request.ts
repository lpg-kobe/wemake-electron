import fetch from 'dva/fetch';
import { API_HOST } from '../constants'

function parseJSON(response: Response) {
  return response.json();
}

function checkStatus(response: Response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error: any = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @param  {object} [handler] The handler callback after "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url: string, options?: any) {
  const token = '';
  // 配置默认headers
  const headers = Object.assign({
    'Content-Type': 'application/json;charset=UTF-8',
  }, options?.headers);
  if (options?.body && (options.body instanceof FormData)) {
    delete headers['Content-Type'];
  }
  if (token) {
    headers['header-token'] = token;
  }

  // 配置默认设置
  const settings = Object.assign({
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
  }, options, { headers });
  // 修复url中多余的斜杠
  const fixUrl = (API_HOST + url).replace(/\/\//g, '/').replace(/:\/([^/])/, '://$1');
  // 非GET方式不允许缓存
  if (settings.method.toUpperCase() !== 'GET') {
    settings['Cache-Control'] = 'no-cache';
  }
  return fetch(fixUrl, settings)
    .then(checkStatus)
    .then(parseJSON)
    .then((data: any) => {
      return { status: true, data };
    })
    .catch((err: any) => {
      return {
        err,
        status: false,
        data: {}
      }
    });
}
