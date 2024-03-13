// 内存池
export default class MemoryPool {
  constructor() {
    this.video = {
      "foresight": new Map(),
      "rearview": new Map(),
      "right_front": new Map(),
      "right_back": new Map(),
      "left_back": new Map(),
      "left_front": new Map(),
    };
    this.objs = new Map();
    this.bevs = new Map();
    this.basic_data = new Map();
    this.keyArr = [];
  }
  // 从内存池中获取内存块
  allocate(key, sign, view) {
    let res;
    if (sign === "video") {
      res = this.video[view].get(key);
      this.video[view].delete(key);
    } else if (sign === "obj"){
      res = this.objs.get(key);
    } else if (sign === "bev") {
      res = this.bevs.get(key);
    } else if (sign === "basic") {
      res = this.basic_data.get(key);
    }
    return res;
  }
  delObjsValue(key) {
    this.objs.delete(key);
    this.bevs.delete(key);
    this.basic_data.delete(key);
  }
  // 将内存块放入内存池
  free(key, block, sign, view) {
    if (sign === "video") {
      this.video[view].set(key, block)
    } else if (sign === "obj"){
      this.objs.set(key, block);
    } else if (sign === "bev") {
      this.bevs.set(key, block);
    } else if (sign === "basic") {
      this.basic_data.set(key, block)
    }
  }
  setKey(key) {
    this.keyArr.push(key);
  }
  getKey() {
    let res = this.keyArr.shift();
    return res;
  }
  // 判断video对应视角中是否已有解码后的视频数据了
  hasVideo(key, view) {
    return this.video[view].has(key);
  }
}
