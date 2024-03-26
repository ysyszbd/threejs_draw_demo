// 内存池
import { ObserverInstance } from "@/controls/event/observer";

export default class MemoryPool {
  observerListenerList = [
    {
      eventName: "SET_DATA",
      fn: this.setData.bind(this),
    },
  ];
  objects = new Map();
  constructor() {
    ObserverInstance.selfAddListenerList(this.observerListenerList, "yh_init");
    // 视频的障碍物canvas
    this.video_objs = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.video_bgs = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.v_bgs = {
      foresight: new WeakMap(),
      rearview: new WeakMap(),
      right_front: new WeakMap(),
      right_back: new WeakMap(),
      left_back: new WeakMap(),
      left_front: new WeakMap(),
    };
    this.objs = new Map(); // 给分割图使用的障碍物数据
    this.bevs = new Map();
    this.keyArr = [];
    this.weakKeys = [];
  }
  // 从内存池中获取内存块
  allocate(key, sign, view) {
    let res;
    if (sign === "obj") {
      res = this.objs.get(key);
      this.objs.delete(key);
    } else if (sign === "bev") {
      res = this.bevs.get(key);
      this.bevs.delete(key);
    } else if (sign === "video_objs") {
      res = this.video_objs[view].get(key);
      this.video_objs[view].delete(key);
    } else if (sign === "v_bgs") {
      res = this.v_bgs[view].get(key);
      this.v_bgs[view].delete(key);
    } else if (sign === "video_bgs") {
      res = this.video_bgs[view].get(key);
      this.video_bgs[view].delete(key);
    }
    return res;
  }
  delObjsValue(key) {
    this.objs.delete(key);
    this.bevs.delete(key);
  }
  // 将内存块放入内存池
  setData(key, block, sign, view) {
    if (sign === "obj") {
      this.objs.set(key, block);
    } else if (sign === "bev") {
      this.bevs.set(key, block);
    } else if (sign === "video_objs") {
      this.video_objs[view].set(key, block);
    } else if (sign === "v_bgs") {
      this.v_bgs[view].set(key, block);
    } else if (sign === "video_bgs") {
      this.video_bgs[view].set(key, block);
    }
  }
  setKey(key) {
    this.keyArr.push(key);
  }
  getKey() {
    return this.keyArr.shift();
  }
  setWeakKeys(key) {
    this.weakKeys.push(key);
  }
  getWeakKeys() {
    return this.weakKeys.shift();
  }
  // 判断video对应视角中是否已有解码后的视频数据了
  hasVideo(key) {
    return (
      this.video_bgs["foresight"].has(key) &&
      this.video_bgs["rearview"].has(key) &&
      this.video_bgs["right_front"].has(key) &&
      this.video_bgs["right_back"].has(key) &&
      this.video_bgs["left_back"].has(key) &&
      this.video_bgs["left_front"].has(key)
      // this.v_bgs["foresight"].has(key) &&
      // this.v_bgs["rearview"].has(key) &&
      // this.v_bgs["right_front"].has(key) &&
      // this.v_bgs["right_back"].has(key) &&
      // this.v_bgs["left_back"].has(key) &&
      // this.v_bgs["left_front"].has(key)
    );
  }
  hasVideoObjs(key) {
    return (
      this.video_objs["foresight"].has(key) &&
      this.video_objs["rearview"].has(key) &&
      this.video_objs["right_front"].has(key) &&
      this.video_objs["right_back"].has(key) &&
      this.video_objs["left_back"].has(key) &&
      this.video_objs["left_front"].has(key)
    );
  }
  clear() {
    // 视频的障碍物canvas
    // this.video_objs.clear();
    this.v_bgs = {
      foresight: new WeakMap(),
      rearview: new WeakMap(),
      right_front: new WeakMap(),
      right_back: new WeakMap(),
      left_back: new WeakMap(),
      left_front: new WeakMap(),
    };
    this.objs.clear();
    this.bevs.clear();
    this.keyArr = [];
  }
}
