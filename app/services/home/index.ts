/**
* @desc api services
* @author pika
*/
import request from '../../utils/request';
import qs from 'qs'

export function gcodeSplit({ params, ...handler }: any) {
  return request(`/gcode/split?${qs.stringify(params)}`, {}, handler);
}

export function postData({ params, ...handler }: any) {
  return request('/post-data', {
    method: 'post',
    body: JSON.stringify(params),
  }, handler);
}
