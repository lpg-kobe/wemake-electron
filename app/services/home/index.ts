/**
* @desc api services
* @author pika
*/
import request from '../../utils/request';
import qs from 'qs'

export function gcodeSplit(param: any) {
  return request(`/gcode/split?${qs.stringify(param)}`, {});
}

export function postData(param: any) {
  return request('/post-data', {
    method: 'post',
    body: JSON.stringify(param),
  });
}
