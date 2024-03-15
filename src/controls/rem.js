(function init(screenRatioByDesign = 16 / 9) {
  let docEle = document.documentElement;
  function setHtmlFontSize() {
    var screenRatio = docEle.clientWidth / docEle.clientHeight;
    var fontSize =
      ((screenRatio > screenRatioByDesign
        ? screenRatioByDesign / screenRatio
        : 1) *
        docEle.clientWidth) /
      10;
    docEle.style.fontSize = fontSize.toFixed(3) + "px";
    console.log(docEle.style.fontSize);
  }
  setHtmlFontSize();
  window.addEventListener("resize", setHtmlFontSize);
})();
