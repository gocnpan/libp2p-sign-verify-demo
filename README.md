# libp2p-sign-verify-demo
基于libp2p的签名与验证

前端用`vue`实现, 后端用`go`实现
- 前端签名实现在[intercept.js](./web/src/request/intercept.js)
- 后端验证实现在[gin.go](./pkg/gin.go)

# run
```shell
git clone https://github.com/gocnpan/libp2p-sign-verify-demo.git

cd libp2p-sign-verify-demo

go mod tidy

cd web

npm install

# 分别在 libp2p-sign-verify-demo & libp2p-sign-verify-demo/web 启动服务
# libp2p-sign-verify-demo
sh start.sh

# libp2p-sign-verify-demo/web
npm run dev
```

api文档: [swagger](http://127.0.0.1:8980/docs/api/index.html)