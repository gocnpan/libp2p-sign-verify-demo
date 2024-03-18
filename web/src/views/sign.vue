<template>
  <div class="sign">
    <div class="get">
      <el-input
        type="textarea"
        :rows="10"
        placeholder="请输入GET请求对象"
        clearable
        autofocus
        v-model="getInput"
      ></el-input>
      <el-button size="small" @click="getEvt">GET签名校验测试</el-button>
    </div>
    <div class="post">
      <el-input
        type="textarea"
        :rows="10"
        placeholder="请输入POST请求对象"
        clearable
        autofocus
        v-model="postInput"
      ></el-input>
      <el-button size="small" @click="postEvt">post签名校验测试</el-button>
    </div>
  </div>
</template>
<script>
import { Message } from 'element-ui'

import api from "@/api/api.js"

export default {
  data() {
    return {
      getInput: `{
  "id": 123,
  "page": 10,
  "limit": 20
}`,
      postInput: `{
  "username": "admin",
  "password": "123456"
}`,
    }
  },
  async mounted() {
  },
  methods: {
    async getEvt(){
      let obj = JSON.parse(this.getInput)
      let res = await api.verifyGet(obj)
      if (res.code == "ok"){
        Message.success("校验成功, url: " + res.data)
      }else{
        Message.error("校验失败: " + res.msg)
      }
    },

    async postEvt(){
      let obj = JSON.parse(this.postInput)
      let res = await api.verifyPost(obj)
      if (res.code == "ok"){
        Message.success("校验成功, 数据在控制台输出")
      }else{
        Message.error("校验失败: " + res.msg)
      }
      console.log("POST校验成功, 数据如下")
      console.log(res.data)
    },
  }
}
</script>

<style>
</style>
