// 内存池
import { deepClone } from "@/controls/box2img.js";
export default class MemoryPool {
  constructor(size = 3, blockSize = 100 * 100) {
    this.size = size;
    this.blockSize = blockSize;
    this.pool = [];
  }
  // 初始化内存池
  initialize() {
    for (let i = 0; i < this.size; i++) {
      this.pool.push(new ArrayBuffer(this.blockSize));
    }
  }
  // 从内存池中获取内存块
  allocate() {
    if (this.pool.length >= 1) {
      let res = this.pool[0];
      this.pool.shift();
      return res;
    } else {
      console.error("Memory pool is empty");
      return null;
    }
  }
  // 将内存块放入内存池
  free(block) {
    this.pool.push(block);
    // this.pool = block;
  }
}
