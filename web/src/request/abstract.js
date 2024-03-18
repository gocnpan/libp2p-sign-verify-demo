/**
 * @description axios 基础构建
 * @author yz
 */

import instance from './intercept'
// import store from 'store'

class Abstract {
  constructor() {
    this.headers = {
      'Content-Type': 'application/json;charset=UTF-8'
    }
    this.headers['Access-Control-Max-Age'] = 3600
  }

  apiAxios({ baseURL = this.baseURL, headers, method, url, data, params, responseType, page, timeout = 10000 }) {
    // const token = store.get('token')
    // if (token) this.headers.Authorization = `Bearer ${token}`
    baseURL = '/api'
    headers = {
      ...this.headers,
      ...headers
    }
    if (page) {
      headers.Prefer = 'count=exact'
    }
    return new Promise((resolve, reject) => {
      instance({
        baseURL,
        headers,
        method,
        url,
        params,
        data,
        responseType,
        page,
        timeout,
      }).then((res) => {
        if (res?.data?.code === 'ok') {
          let data = res.data || res
          if (page || res.headers['content-range']) {
            const dataList = Object.keys(res.data.data).length !== 0 ? res.data.data : []
            const range = res.headers['content-range'] ? res.headers['content-range'].split('/') : []
            const totals = Number(range[1]) >> 0 // 数据的总数
            data = Object.assign({}, {})
            data.code = 'ok'
            data.msg = 'success'
            data.data = {
              list: dataList,
              pagination: { page: '', size: '', total: totals }
            }
          }
          resolve(data)
        } else {
          const returnData = res?.data || { code: 'fail', data: res, msg: '接口异常' }
          resolve(returnData)
          // resolve({ status: false, message: res.data?.msg || (url + '请求失败'), data: res.data?.data, origin: res.data })
        }
      }).catch((err) => {
        const message = err?.data?.errorMessage || err?.message || (url + '请求失败')
        /* eslint-disable */
        reject({ status: false, message, data: null })
      })
    })
  }

  /**
   * GET类型的网络请求
   */
  getReqs({ baseURL, headers, url, data, params, responseType, page, timeout }) {
    return this.apiAxios({ baseURL, headers, method: 'GET', url, data, params, responseType, page, timeout })
  }

  /**
   * POST类型的网络请求
   */
  postReqs({ baseURL, headers, url, data, params, responseType, timeout }) {
    return this.apiAxios({ baseURL, headers, method: 'POST', url, data, params, responseType, timeout })
  }
}

export default Abstract
