/**
 * 面试速记版 DeepClone
 * 核心点：
 * 1. 基础类型直接返回
 * 2. 循环引用处理 (WeakMap)
 * 3. 复杂类型处理 (Date, RegExp)
 * 4. 递归拷贝
 */
function deepClone(obj, hash = new WeakMap()) {
    // 1. 处理 null 和 基础类型
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 2. 处理特殊对象 Date, RegExp
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);

    // 3. 处理循环引用
    if (hash.has(obj)) {
        return hash.get(obj);
    }

    // 4. 初始化新对象 (使用 constructor 可以同时处理 Array 和 Object)
    // 也可以写成: const cloneObj = Array.isArray(obj) ? [] : {};
    const cloneObj = new obj.constructor();
    
    // 记录到 hash 表
    hash.set(obj, cloneObj);

    // 5. 遍历属性 (Reflect.ownKeys 可以包含 Symbol 属性，面试加分点)
    // 如果记不住 Reflect.ownKeys，可以使用 for...in + hasOwnProperty
    Reflect.ownKeys(obj).forEach(key => {
        cloneObj[key] = deepClone(obj[key], hash);
    });

    return cloneObj;
}

// ================= 测试用例 =================

const obj = {
    num: 1,
    str: 'str',
    bool: true,
    nullVal: null,
    undefinedVal: undefined,
    symbolVal: Symbol('sym'),
    date: new Date(),
    reg: /\d+/,
    arr: [1, 2, { a: 3 }],
    func: function() { console.log('func'); }, // 函数通常不需要深拷贝，直接引用即可
    [Symbol('key')]: 'symbolValue'
};

// 循环引用测试
obj.self = obj;

console.log('--- 原对象 ---');
// console.log(obj);

const cloned = deepClone(obj);

console.log('--- 克隆对象 ---');
console.log(cloned);

console.log('--- 验证 ---');
console.log('obj !== cloned:', obj !== cloned);
console.log('obj.arr !== cloned.arr:', obj.arr !== cloned.arr);
console.log('obj.arr[2] !== cloned.arr[2]:', obj.arr[2] !== cloned.arr[2]);
console.log('obj.date !== cloned.date:', obj.date !== cloned.date);
console.log('obj.reg !== cloned.reg:', obj.reg !== cloned.reg);
console.log('循环引用 obj.self === cloned.self:', cloned.self === cloned);
