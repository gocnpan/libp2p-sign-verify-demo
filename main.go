package main

import "github.com/gocnpan/libp2p-sign-verify-demo/pkg"

// @title Libp2p签名验证Demo
// @version 1.0
// @description 前端签名, 后端验证
// @host http://127.0.0.1
// @BasePath /api
func main() {
	pkg.Router()
}
