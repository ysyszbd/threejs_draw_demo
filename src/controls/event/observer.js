/*
 * @Author: yinshunyu
 * @Date: 2022-11-24 10:00:59
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2024-03-04 17:01:35
 * @FilePath: \DataClient\src\components\draw\event\observer.ts
 * @Description:
 *
 */
import EventEmitter from "eventemitter3";

class SelfObserver extends EventEmitter {
  constructor() {
    super();
  }

  removeAll(context) {
    this.removeAllListeners(context);
  }
  removeEvents(context, callback) {
    this.removeListener(context, callback);
  }

  // 解绑事件
  selfOff(event, context) {
    this.off(event, this.getFn(event, context));
    return this;
  }
  // 获取注册函数
  getFn(eventName, content) {
    let events = this.listeners(eventName);
    if (Array.isArray(events)) {
      return events.find((item) => {
        if (item.content == content) {
          return item.fn;
        }
      });
    } else {
      return events.fn;
    }
  }
  // 集体注册事件
  selfAddListenerList(
    observerListenerList,
    content
  ) {
    for (let i = 0; i < observerListenerList.length; i++) {
      this.on(
        observerListenerList[i].eventName,
        observerListenerList[i].fn,
        content
      );
    }
  }
  // 集体解绑事件
  selfOffListenerList(eventArgsList, content) {
    for (let i = 0; i < eventArgsList.length; i++) {
      this.selfOff(eventArgsList[i].eventName, content);
    }
  }
}
// 单例观察者模式
const ObserverInstance = new SelfObserver();

export { ObserverInstance };
