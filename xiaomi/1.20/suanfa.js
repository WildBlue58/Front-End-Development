// 有序数组平方后排序
const arr = [-4, -1, 0, 3, 5]
function solution(arr) {
    const len = arr.length
    const result = new Array(len)
    let left = 0
    let right = len - 1
    let index = len - 1
    while (left <= right) {
        if (arr[left] * arr[left] > arr[right] * arr[right]) {
            result[index] = arr[left] * arr[left]
            left++
        } else {
            result[index] = arr[right] * arr[right]
            right--
        }
        index--
    }
    return result
}
console.log(solution(arr));
