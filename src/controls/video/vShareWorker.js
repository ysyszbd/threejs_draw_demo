self.onconnect = (e) => {
  const port = e.ports[0];
  console.log("-------------------------", e);
  

  // 监听消息
  port.onmessage = (e) => {
    console.log(e.data);
    port.postMessage({data: new libde265.Decoder()});
  };
};
