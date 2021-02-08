/**
 * @desc common tool
 * @author pika
 */

const { v4 } = require('uuid');
// flag of requestAnimationFrame 
let rafFlag: any = {}

// random guid base Number(16)
export function createGUID() {
  return v4();
}

export function getStore(name: any) {
  try {
    // @ts-ignore
    return JSON.parse(localStorage.getItem(name))
  } catch (error) {
    console.warn('can not parse user object witch you want to get...');
    // @ts-ignore
    return {}
  }
}

export function setStore(key: any, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('can not stringify user object witch you want to save...');
    localStorage.setItem(key, JSON.stringify({}));
  }
}

export function removeStore(key: any) {
  return localStorage.removeItem(key);
}

export function scrollElement(dom: HTMLElement, position: any) {
  if (!dom.nodeType) {
    throw new Error(`target of ${dom} is not an HTMLElement`)
  }
  if (isNaN(position)) {
    const scrollReact: any = {
      'bottom': () => dom.scrollTop = dom.scrollHeight,
      'top': () => dom.scrollTop = 0
    }
    scrollReact[position] && scrollReact[position]()
  } else {
    dom.scrollTop = position
  }
}

// 跟随屏幕帧率节流
export function tottle(fn: any, key?: string) {
  key = key || 'default'
  if (!rafFlag[key]) {
    window.requestAnimationFrame(() => {
      fn()
      // @ts-ignore
      rafFlag[key] = false
    })
  }
  rafFlag[key] = true
}

// debounce防抖
export function debounce(fn: () => void, wait?: number, immediate?: boolean, context?: any) {
  wait = wait || 50
  let timer: any = null
  return function () {
    if (immediate) {
      // @ts-ignore
      fn.apply(this, [...arguments, context])
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, [...arguments, context])
    }, wait)
  }
}


/**
 * @desc 跟随帧率刷新获取dom最新的位置
 * @param {HTMLElement} dom 监听的dom节点
 * @param {Function} callback 回调函数
 */
export function nextTick(dom: HTMLElement | string, callback?: any) {
  const realDom: any = typeof (dom) === 'string' ? document.querySelector(dom) : dom
  if (!realDom.nodeType) {
    throw new Error(`target of ${realDom} is not an HTMLElement`)
  }

  const rect = realDom.getBoundingClientRect()
  // 触发首次对比
  let prevTop = rect.top - 1
  let prevLeft = rect.left - 1

  function getPosition() {
    const nextRect = realDom.getBoundingClientRect()
    if (prevTop !== nextRect.top || prevLeft !== nextRect.left) {
      prevTop = nextRect.top
      prevLeft = nextRect.left
      window.requestAnimationFrame(getPosition)
      return 'not real position'
    } else {
      const curRect = {
        offsetTop: realDom.offsetTop,
        offsetLeft: realDom.offsetLeft,
        scrollHeight: realDom.scrollHeight,
        rect: realDom.getBoundingClientRect()
      }
      callback && callback(curRect);
      return curRect
    }
  }
  getPosition()
}


/**
 * @desc 过滤字符文本换行符
 * @param {String} text 文本内容
 */
export function filterBreakWord(text: any) {
  return text.replace(/\n/g, '<br/>')
}

/**
 * @desc 路由自定义拼接
 * @param {String} path hashRouter-path or browserRouter-path
 */
export function judgeRouterUrl(path: string) {
  path = path.replace(/^\//, '')
  // hashRouter
  if (location.hash) {
    return `${location.origin}${location.pathname}#/${path}`
  } else {
    // browserRouter
    return `${location.origin}${location.pathname}${path}`
  }
}

/**
 * @desc setTimeout 递归模拟 setInterval,可轮询异步status
 * @param {Function} fn callback
 * @param {timer} setTimeout timer result
 * @param {delay} Number 间隔时间
 */
export function loopToInterval(fn: Function, timer: any, delay: number = 8 * 1000) {
  async function loop() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const isContinue = await fn()
    isContinue && (timer = setTimeout(loop, delay))
  }
  loop()
  return timer
}

/**
 * @desc 倒计时
 * @param {Number} 开始时间
 * @param {Number} 结束时间
 * @param {Number||null} timer setTimeout timer
 * @param {Function} fn callback after countdown
 */
export function countdown(endTime: number, timer: number | null, delay: number = 1 * 1000, fn: Function) {
  loopToInterval(() => {
    const distance = endTime - new Date().getTime()
    const disDay = Math.floor(distance / 24 / 60 / 60 / 1000)
    const disHour = Math.floor((distance / 60 / 60 / 1000)) % 24
    const disMin = Math.floor((distance / 60 / 1000)) % 60
    const disSec = Math.floor((distance / 1000)) % 60
    const disMs = distance % 1000
    if (distance > 0) {
      fn({
        day: disDay < 10 ? `0${disDay}` : disDay,
        hour: disHour < 10 ? `0${disHour}` : disHour,
        minutes: disMin < 10 ? `0${disMin}` : disMin,
        second: disSec < 10 ? `0${disSec}` : disSec,
        milSecond: disMs,
      })
      return true
    } else {
      fn(0)
      return false
    }
  }, timer, delay)
}

/**
 * @desc 全屏元素
 */
export function fullScreenEle(ele: any) {
  ele = ele || document.documentElement
  const fullFn =
    ele.requestFullscreen ||
    ele.mozRequestFullScreen ||
    ele.webkitRequestFullscreen ||
    ele.msRequestFullscreen;
  fullFn.call(ele)
}

/**
 * @desc 退出全屏
 */
export function exitFullScreen() {
  const cancelFn =
    (document as any).exitFullScreen ||
    (document as any).mozCancelFullScreen ||
    (document as any).webkitExitFullscreen ||
    (document as any).msExitFullscreen
  cancelFn.call(document);
}

/**
 * @desc 图片宽高等比换算机器X轴Y轴坐标
 */
export function transImgToMachineSize(size: any, width: number, height: number) {
  let height_ = height;
  let width_ = width;
  if (width_ * size.y >= height_ * size.x && width_ > size.x) {
    height_ = size.x * height_ / width_;
    width_ = size.x;
  }
  if (height_ * size.x >= width_ * size.y && height_ > size.y) {
    width_ = size.y * width_ / height_;
    height_ = size.y;
  }
  return { width: width_, height: height_ };
};