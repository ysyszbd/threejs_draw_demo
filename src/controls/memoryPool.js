// 内存池
import { ObserverInstance } from "@/controls/event/observer";

export default class MemoryPool {
  instance;
  op;
  observerListenerList = [
    {
      eventName: "SET_DATA",
      fn: this.setData.bind(this),
    },
  ];
  constructor() {
    ObserverInstance.selfAddListenerList(this.observerListenerList, "yh_init");
    this.video = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.video_objs = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.video_bg = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.objs = new Map();
    this.video_objs_arr = new Map();
    this.bevs = new Map();
    this.basic_data = new Map();
    this.keyArr = [];
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new MemoryPool();
    }
    return this.instance;
  }
  // 从内存池中获取内存块
  allocate(key, sign, view) {
    let res;
    if (sign === "video") {
      res = this.video[view].get(key);
      this.video[view].delete(key);
    } else if (sign === "obj") {
      res = this.objs.get(key);
    } else if (sign === "bev") {
      res = this.bevs.get(key);
    } else if (sign === "basic") {
      res = this.basic_data.get(key);
    } else if (sign === "video_objs") {
      res = this.video_objs[view].get(key);
      this.video_objs[view].delete(key);
    } else if (sign === "video_objs_arr") {
      res = this.video_objs_arr.get(key);
    } else if (sign === "video_bg") {
      res = this.video_bg[view].get(key);
      this.video_bg[view].delete(key);
    }
    return res;
  }
  delObjsValue(key) {
    this.objs.delete(key);
    this.bevs.delete(key);
    this.basic_data.delete(key);
    this.video_objs_arr.delete(key);
  }
  delVideoValue(key, sign, view) {
    if (sign === "video") {
      this.video[view].delete(key);
    } else if (sign === "video_bg") {
      this.video_bg[view].delete(key);
    } 
  }
  // 将内存块放入内存池
  setData(key, block, sign, view) {
    if (sign === "video") {
      this.video[view].set(key, block);
    } else if (sign === "obj") {
      this.objs.set(key, block);
    } else if (sign === "bev") {
      this.bevs.set(key, block);
    } else if (sign === "basic") {
      this.basic_data.set(key, block);
    } else if (sign === "video_objs") {
      this.video_objs.set(key, block);
    } else if (sign === "video_objs_arr") {
      this.video_objs_arr.set(key, block);
    } else if (sign === "video_bg") {
      this.video_bg[view].set(key, block);
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
    return this.video_bg[view].has(key);
  }
}
