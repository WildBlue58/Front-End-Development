import { getEncodingForModel } from 'tiktoken';
// AIGC 生成的文本 要计算 token 数量 按token 不断推理生成的

const modelName = "gpt-4"
const encodingName = getEncodingForModel(modelName);
console.log(encodingName,'/////');

const enc = getEncoding(encodingName);
// 不同语言 字符语义一样 但长度不一样 token 按语义计算开销
console.log('apple', enc.encode('apple'));
console.log('apple', enc.encode('apple').length);
console.log('apple', enc.encode('apple').length);