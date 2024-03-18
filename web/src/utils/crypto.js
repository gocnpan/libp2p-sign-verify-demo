import { generateKeyPair, unmarshalPrivateKey, unmarshalPublicKey } from '@libp2p/crypto/keys'
import { createFromPrivKey } from '@libp2p/peer-id-factory'
import { toString as uint8ArrayToString } from "uint8arrays/to-string"
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { peerIdFromBytes } from '@libp2p/peer-id'

// 生成 id key
export async function generateIDKey(){
  const privKey = await generateKeyPair("Ed25519")
  const id = await createFromPrivKey(privKey)

  return {
    id: id,
    privKey: privKey
  }
}

/**
 * 转换为 json 可存储
 * @param {PeerId} id 
 */
export function toJSON(id){
  return {
    id     : id.toString(),
    privKey: uint8ArrayToString(id.privateKey, "base64pad"),
    pubKey : uint8ArrayToString(id.publicKey, "base64pad")
  }
}

/**
 * 将 id 转换为 字符串
 * @param {PeerId} id 
 * @returns 
 */
export function idToString(id){
  return id.toString()
}

/**
 * 将 public key 转换为 string
 * @param {PublicKey} pubKey 
 * @returns 
 */
export function pubKeyToString(pubKey){
  return uint8ArrayToString(pubKey, "base64pad")
}

/**
 * 字符串转换 public key
 * @param {string} pub 
 */
export async function stringToPubKey(pub){
  const key = unmarshalPublicKey(uint8ArrayToString(pub, "base64pad"))
}

/**
 * 从 json 中生成 id key
 * @param {{id: string, privKey: string, pubKey: string}} obj 
 */
export async function createFromJSON(obj){
  const privKey = await unmarshalPrivateKey(uint8ArrayFromString(obj.privKey, 'base64pad'))
  const id = await createFromPrivKey(privKey)

  return {
    id: id,
    privKey: privKey
  }
}

/**
 * 通过私钥签名信息
 * @param {PrivateKey} privKey 
 * @param {string} msg 
 * @return {string}
 */
export async function signMessage(privKey, msg){
  let sig = await privKey.sign(uint8ArrayFromString(msg))
  return uint8arrayToBase64(sig)
}

/**
 * 从 peer id string 生成 public key
 * 用于其他节点传输过来的 验证签名
 * @param {string} id 
 */
function idToPubKey(id){
  let idObj = peerIdFromBytes(uint8ArrayFromString(id, 'base58btc'))
  return unmarshalPublicKey(idObj.publicKey)
}

/**
 * 验证消息
 * 传入 peer id 字符串
 * @param {string} id 
 * @param {string} msg 
 * @param {string} sign 
 */
export async function verifyMessageFromID(id, msg, sign){
  try {
    let pubKey = idToPubKey(id)
  
    let mb = uint8ArrayFromString(msg)
    let sb = base64ToUint8Array(sign)
    
    let t = await pubKey.verify(mb,sb)
    return t
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * 验证消息
 * 传入 public key string
 * @param {string} pub 
 * @param {string} msg 
 * @param {string} sign 
 * @returns 
 */
export async function verifyMessageFromPub(pub, msg, sign){
  try {
    const pubKey = unmarshalPublicKey(uint8ArrayFromString(pub, 'base64pad'))
  
    let mb = uint8ArrayFromString(msg)
    let sb = base64ToUint8Array(sign)
  
    let t = await pubKey.verify(mb,sb)
    return t
  } catch (error) {
    debugger
    console.error(error)
    return false
  }
}

/**
 * 将 Uint8Array 转换为 base64 string
 * @param {Uint8Array} u8Arr 
 * @returns 
 */
function uint8arrayToBase64(u8Arr) {
  let CHUNK_SIZE = 0x8000; //arbitrary number
  let index = 0;
  let length = u8Arr.length;
  let result = '';
  let slice;
  while (index < length) {
      slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, slice);
      index += CHUNK_SIZE;
  }
  // web image base64图片格式: "data:image/png;base64," + b64encoded;
  // return  "data:image/png;base64," + window.btoa(result);
  return window.btoa(result);
}

/**
 * 将 base64 字符串转换为 Uint8Array
 * @param {string} base64String 
 * @returns 
 */
function base64ToUint8Array(base64String) {
  let padding = '='.repeat((4 - base64String.length % 4) % 4);
  let base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

  let rawData = window.atob(base64);
  let outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}