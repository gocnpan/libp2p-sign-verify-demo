/**
 * @description 实例化 axios 和 添加请求和响应拦截
 * @author yz
 */
import axios from 'axios'
import { Message } from 'element-ui'
// import router from '../router'
import NProgress from 'nprogress'
import qs from "qs"
import * as crypto from "../utils/crypto.js"
import sha1 from 'crypto-js/sha1.js'

// 取消重复请求
const pending = []
const CancelToken = axios.CancelToken

var idKey;

// axios 实例
const instance = axios.create({
  timeout: 10000,
  responseType: 'json'
})

// 移除重复的请求
const removePending = (config) => {
  for (const key in pending) {
    const item = Number(key)
    const list = pending[key]

    // 当前请求在数组中存在是执行函数体
    if (list.url === config.url && list.method === config.method && JSON.stringify(list.params) === JSON.stringify(config.params) && JSON.stringify(list.data) === JSON.stringify(config.data)) {
      // 执行取消操作
      list.cancel('操作太频繁,  请稍后再试')
      // 从数组中移除记录
      pending.splice(item, 1)
    }
  }
}

// 添加请求拦截器
instance.interceptors.request.use(
  async (request) => {

    if (!idKey) {
      idKey = await crypto.generateIDKey()
    }

    NProgress.start()
    removePending(request)
    request.cancelToken = new CancelToken((c) => {
      pending.push({ url: request.url, method: request.method, params: request.params, data: request.data, cancel: c })
    })

    let hash, sign
    if (request.method == "get"){
      let uri = request.baseURL + request.url
      if (request.params && JSON.stringify(request.params) != "{}"){
        uri += "?" + qs.stringify(request.params)
      }
      hash = sha1(uri).toString()
      sign = await crypto.signMessage(idKey.privKey, hash)
    }

    if (request.method == "post"){
      if (!request.data || JSON.stringify(request.data) == "{}"){
        return request
      }
      hash = sha1(JSON.stringify(request.data)).toString()
      sign = await crypto.signMessage(idKey.privKey, hash)
    }

    if (sign) {
      request.headers["Req-Hash"] = hash
      request.headers["Req-Sign"] = sign
      request.headers["Front-Id"] = idKey.id.toString()
    }

    // console.log('请求拦截器')
    // console.log(request)
    // debugger

    return request
  },
  error => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
instance.interceptors.response.use(
  (response) => {
    NProgress.done()
    removePending(response.config)
    const { code } = response?.data
    if (code === "invalid-auth"){
      Message.error('token失效, 请重新登录')
      // router.replace('/login')
      return Promise.resolve('')
    }
    return response
  },
  error => {
    NProgress.done()
    const response = error.response
    if (!response) return Promise.resolve()
    switch (response.status) {
      case 401:
        // token失效
        Message.error('token失效, 请重新登录') 
        // router.replace('/login')
        break
      case 403:
        // 没有权限
        Message.error('token过期, 请重新登录')
        // router.replace('/login')
        return Promise.resolve('')
      case 404:
        // 没有权限
        Message.error('不存在接口')
        return Promise.resolve('')
      case 500:
        // 服务端错误
        Message.error('服务端错误')
        return Promise.resolve('')
      case 503:
        // 服务端错误
        Message.error('服务端错误')
        return Promise.resolve('')
      default:
        Message.error('未知错误')
        return Promise.resolve('')
    }

    // 超时重新请求
    const config = error.config
    // 全局的请求次数, 请求的间隔
    const [RETRY_COUNT, RETRY_DELAY] = [2, 1000]

    if (config && RETRY_COUNT) {
      // 设置用于跟踪重试计数的变量
      config.__retryCount = config.__retryCount || 0
      // 检查是否已经达到重试最大次数
      if (config.__retryCount >= RETRY_COUNT) {
        return Promise.resolve('')
      }
      // 增加重试计数
      config.__retryCount++
      // 创造新的Promise来处理指示后退
      const backoff = new Promise((resolve) => {
        setTimeout(() => {
          resolve()
        }, RETRY_DELAY || 1)
      })

      // instance重试请求的Promise
      return backoff.then(() => {
        return instance(config)
      })
    }
    return Promise.resolve('')
  }
)

export default instance
