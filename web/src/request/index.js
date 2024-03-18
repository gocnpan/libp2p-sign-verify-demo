import apis from '@/api'
import { Message } from 'element-ui'
import addRecord from '@/utils/operateLog.js'
import typeV from '@/utils/type_verification.js'

function deepDec(data, arr) {
  let l = arr.shift()
  let val = ''
  while (true) {
    if (!l) return val
    val = data[l]
    data = data[l]
    if (!data) return ''
    l = arr.shift()
  }
}

function analysis(data, d) {
  for (const key in data) {
    const item = data[key]
    if (typeV(item) === 'array') {
      item.forEach(v => {
        analysis(v, d)
      })
    } else if (typeV(item) === 'object') {
      analysis(item, d)
    } else if (typeV(item) === 'string') {
      if (item.indexOf('key:') === 0) {
        let val = item.substr(4)
        val = val.split('.')

        data[key] = deepDec(d, val)
      }
    }
  }
}

export const $req = {
  lastResult: {},
  allResult: [],
  data: {},
  fn: [],

  addRecord: function (data) {
    const fn = async () => {
      let reqData = {}
      if (data) {
        analysis(data, this.data)
        reqData = Object.assign({}, data)
      }

      const logRes = await addRecord(reqData)
      this.lastResult = logRes
      this.allResult.push(logRes)
      this.data.addRecord = logRes
      return true
    }
    this.fn.push(fn)
    return this
  },

  next: async function () {
    this.lastResult = {}
    this.allResult = []
    while (this.fn[0]) {
      // const fn = this.fn[i]
      const result = await this.fn[0]()
      this.fn.shift()
      if (!result) {
        this.fn = []
        return false
      }
    }
    return this
  },

  all: function () {
    return this.allResult
  },

  last: function () {
    return this.lastResult
  }
}

for (const key in apis) {
  const item = apis[key]
  const fnArrKey = Object.getOwnPropertyNames(item.__proto__).filter(v => v !== 'constructor') // eslint-disable-line
  fnArrKey.forEach(v => {
    const _key = `${key}${v.slice(0, 1).toUpperCase()}${v.slice(1)}`
    $req[_key] = function ({
      key,
      data,
      errMsg,
      replace
    }) {
      const fn = async () => {
        const reqData = Object.assign({}, data)
        if (replace && data) {
          analysis(reqData, $req.data)
          // reqData = Object.assign({}, data)
        }

        const res = await item[v](reqData)
        if (!res) {
          Message.error(errMsg || res.msg)
          return false
        }

        $req.lastResult = res
        $req.allResult.push(res)
        if (key) {
          $req.data[key] = res.data
        }
        return true
      }

      $req.fn.push(fn)
      return $req
    }
  })
}

console.log($req + '55')
