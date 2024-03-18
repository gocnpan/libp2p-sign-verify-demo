package pkg

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Router() {
	router := gin.Default()

	// 跨域 & 验证签名
	router.Use(midCors(), midSignVerify())

	api := router.Group("/api")

	api.GET("/any", getAny)

	api.POST("/any", postAny)

	router.Run(":8980")
}

// getAny godoc
// @Summary 任意get
// @Description 输入任意query参数
// @Tags file
// @Accept json
// @Produce json
// @Param any query any false "任意值"
// @Success 200 {object} Res{data=string} "成功获取文件列表"
// @Router /api/any [get]
func getAny(c *gin.Context) {
	ResData(c, c.Request.RequestURI)
}

// 任意post
func postAny(c *gin.Context) {
	bt, err := io.ReadAll(c.Request.Body)
	if err != nil {
		ResMsg(c, CodeDataErr, "read body error")
		return
	}

	log.Printf("post body: %s", string(bt))

	var m map[string]interface{}
	err = json.Unmarshal(bt, &m)
	if err != nil {
		ResMsg(c, CodeDataErr, "parse body error")
		return
	}
	ResData(c, m)
}

// 配置跨域
func midCors() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method //请求方法

		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Headers", "*")
		c.Header("Access-Control-Expose-Headers", "*")
		c.Header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")

		//放行所有OPTIONS方法
		if method == "OPTIONS" {
			c.JSON(http.StatusOK, "Options Request!")
			c.Abort()
			return
		}
	}
}

func midSignVerify() gin.HandlerFunc {
	// 获取请求参数
	return func(c *gin.Context) {
		method := c.Request.Method //请求方法

		var bt []byte
		var err error

		sig := c.Request.Header.Get("Req-Sign")
		if sig == "" {
			ResMsg(c, CodeAccessDenied, "Req-Sign is empty")
			c.Abort()
			return
		}
		id := c.Request.Header.Get("Front-Id")
		if id == "" {
			ResMsg(c, CodeAccessDenied, "Front-Id is empty")
			c.Abort()
			return
		}

		if method == http.MethodPost {
			// bt, err = c.GetRawData()
			bt, err = io.ReadAll(c.Request.Body)
			if err != nil {
				ResMsg(c, CodeAccessDenied, "get raw data failed")
				c.Abort()
				return
			}
			c.Request.Body = io.NopCloser(bytes.NewReader(bt))
		} else if method == http.MethodGet {
			bt = []byte(c.Request.RequestURI)
		} else {
			ResMsg(c, CodeAccessDenied, "method is not supported")
			c.Abort()
			return
		}

		if ok, err := verifyBytes(bt, sig, id); err != nil {
			ResMsg(c, CodeAccessDenied, "verify failed err: "+err.Error())
			c.Abort()
			return
		} else if !ok {
			ResMsg(c, CodeAccessDenied, "verify failed")
			c.Abort()
			return
		}

		log.Printf("%s-%s: 请求通过校验", method, c.Request.RequestURI)
	}
}

func verifyBytes(data []byte, sig, id string) (bool, error) {
	hash := GenerateHashByByte(data)
	return verifyMsg(hash, sig, id)
}

func verifyMsg(hash, sig, id string) (bool, error) {
	// 获取 peer id
	pid, err := StringToID(id)
	if err != nil {
		return false, err
	}
	// 获取 public key
	pubKey, _ := IDToPubKey(pid)

	return VerifyMessage(hash, sig, pubKey)
}

type Res struct {
	Code string      `json:"code"`
	Msg  string      `json:"msg,omitempty"`
	Data interface{} `json:"data,omitempty"`
}

const (
	CodeOk           string = "ok"              // 执行成功
	CodeDataErr      string = "data-error"      // 数据错误
	CodeSysErr       string = "sys-error"       // 系统错误
	CodeEosErr       string = "eos-error"       // 提交 eos 出错
	CodeIpfsErr      string = "ipfs-error"      // 提交 ipfs 出错
	CodeSqlErr       string = "sql-error"       // 数据库错误
	CodeInvalidReq   string = "invalid-request" // 非法请求
	CodeInvalidValue string = "invalid-value"   // 非法值
	CodeAccessDenied string = "access-denied"   // 没有权限
)

func ResMsg(c *gin.Context, code, msg string) {
	data := Res{
		Code: code,
		Msg:  msg,
	}

	Response(c, data)
}

func ResData(c *gin.Context, data interface{}) {
	Response(c, Res{
		Code: CodeOk,
		Data: data,
	})
}

// Response 响应
func Response(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}
