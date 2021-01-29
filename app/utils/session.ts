/**
 * @desc handler to save user login status
 * @author pika
 */

type StorageType = {
  [key: string]: any;
};

export function saveUserSession(payload: any) {
  try {
    localStorage.setItem('userInfo', JSON.stringify(payload));
  } catch (error) {
    console.warn('can not paerse user object witch you eant to save...');
    localStorage.setItem('userInfo', JSON.stringify({}));
  }
}

export function removeUserSession() {
  localStorage.removeItem('userInfo');
}

export function getUserSession(storage: StorageType = localStorage) {
  return JSON.parse(storage.getItem('userInfo'));
}
