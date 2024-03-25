// 内存池
import { ObserverInstance } from "@/controls/event/observer";

export default class MemoryPool {
  observerListenerList = [
    {
      eventName: "SET_DATA",
      fn: this.setData.bind(this),
    },
  ];
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
    this.video_bg = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.video_bgs = new Map();
    this.objs = new Map(); // 给分割图使用的障碍物数据
    this.bevs = new Map();
    this.keyArr = [];
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
    } else if (sign === "video_bg") {
      res = this.video_bg[view].get(key);
      this.video_bg[view].delete(key);
    }
    return res;
  }
  delObjsValue(key) {
    this.objs.delete(key);
    this.bevs.delete(key);
  }
  delVideoValue(key, sign, view) {
    if (sign === "video_bg") {
      this.video_bg[view].delete(key);
    }
  }
  // 将内存块放入内存池
  setData(key, block, sign, view) {
    if (sign === "obj") {
      this.objs.set(key, block);
    } else if (sign === "bev") {
      this.bevs.set(key, block);
    } else if (sign === "video_objs") {
      this.video_objs[view].set(key, block);
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
  hasVideo(key) {
    return (
      this.video_bg["foresight"].has(key) &&
      this.video_bg["rearview"].has(key) &&
      this.video_bg["right_front"].has(key) &&
      this.video_bg["right_back"].has(key) &&
      this.video_bg["left_back"].has(key) &&
      this.video_bg["left_front"].has(key)
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
}
