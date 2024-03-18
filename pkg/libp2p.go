package pkg

import (
	"crypto/sha1"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"

	"github.com/libp2p/go-libp2p-core/crypto"
	"github.com/libp2p/go-libp2p-core/peer"
)

// 生成 公私钥
func GenerateKey(src io.Reader) (crypto.PrivKey, crypto.PubKey, error) {
	return crypto.GenerateEd25519Key(src)
}

// 将公钥转换为 字符串
func PubKeyToString(pub crypto.PubKey) (string, error) {
	bt, err := crypto.MarshalPublicKey(pub)
	if err != nil {
		return "", err
	}
	return crypto.ConfigEncodeKey(bt), nil
}

// 将字符串转换为 公钥
func StringToPubKey(pub string) (crypto.PubKey, error) {
	bt, err := crypto.ConfigDecodeKey(pub)
	if err != nil {
		return nil, err
	}
	return crypto.UnmarshalPublicKey(bt)
}

// 从 public key 生成 peer id
func PubKeyToID(pub crypto.PubKey) (peer.ID, error) {
	return peer.IDFromPublicKey(pub)
}

// 从 peer id 生成 public key
func IDToPubKey(id peer.ID) (crypto.PubKey, error) {
	return id.ExtractPublicKey()
}

// 将 id 生成 string
func IDToString(id peer.ID) string {
	return id.String()
}

// 将 string 转换为 id
func StringToID(id string) (peer.ID, error) {
	return peer.Decode(id)
}

// 将需要签名的消息转换为 base64 字符串
func SignMessage(msg string, priv crypto.PrivKey) (string, error) {
	sig, err := priv.Sign([]byte(msg))
	if err != nil {
		return "", err
	}
	return ByteToBase64(sig), nil
}

// 校验消息
func VerifyMessage(msg, sig string, pub crypto.PubKey) (bool, error) {
	bt, err := Base64ToByte(sig)
	if err != nil {
		return false, err
	}
	return pub.Verify([]byte(msg), bt)
}

// 将 签名结果([]byte)转换为 base64
func ByteToBase64(b []byte) string {
	return base64.StdEncoding.EncodeToString(b)
}

// 将 base64 字符串转换为 []byte
func Base64ToByte(s string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(s)
}

// 将结构体生成hash值
func GenerateHashByData(data interface{}) (string, error) {
	bt, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	return GenerateHashByByte(bt), nil
}

// 将[]byte 生成hash值
func GenerateHashByByte(bt []byte) string {
	h := sha1.Sum(bt)
	hash := hex.EncodeToString(h[:])
	log.Printf("data: %s, hash: %s", string(bt), hash)
	return hash
}
