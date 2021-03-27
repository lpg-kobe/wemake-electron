/**
 * @desc all api request during app
 * @author pika
 */

export const gcodeSplit = (dispatch: (action: any) => void) => new Promise((resolve, reject) => {
  dispatch({
    type: 'home/gcodeSplit',
    payload: {
      params: {},
      onSuccess: (data: any) => resolve(data),
      onError: () => reject(false)
    }
  })
})