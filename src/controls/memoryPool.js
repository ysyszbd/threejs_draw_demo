// 内存池
export default class MemoryPool {
  constructor(size, blockSize) {
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
    if (this.pool.length > 0) {
      return this.pool.pop();
    } else {
      console.error('Memory pool is empty');
      return null;
    }
  }
  // 将内存块放入内存池
  free(block) {
    this.pool.push(block);
  }
}