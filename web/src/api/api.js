/**
 * 基础数据 API 集合类
 * 集成Abstract
 * @date 2023-03-06
 */
import Abstract from '../request/abstract'

class Basic extends Abstract {
  verifyPost(data) {
    return this.postReqs({url: "/any", data: data})
  }

  verifyGet(data) {
    return this.getReqs({url: "/any", params: data})
  }
}

// 单例模式返回对象
Basic.init = (() => {
  let instance
  return () => {
    if (!instance) {
      instance = new Basic()
    }
    return instance
  }
})()

export default Basic.init()
