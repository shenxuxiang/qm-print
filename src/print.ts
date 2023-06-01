import JSPDF from "jspdf";
import html2canvas from 'html2canvas';

type PDFOptions = {
  orientation?: 'p' | 'l' | 'portrait' | 'landscape',
  format?: 'a3' | 'a4' | 'a5',
  unit?: "pt" | "px" | "in" | "mm" | "cm" | "ex" | "em" | "pc",
}

type Html2CanvasOptions = {
  // 是否允许跨域渲染 canvas 画布
  allowTaint: boolean,
   // 是否允许跨域加载图像
  useCORS: boolean,
  // 缩放比例。默认为 window.devicePixelRatio
  scale: number,
  // 画布X坐标偏移量
  x: number,
  // 画布Y坐标偏移量
  y: number,
}

export default class Printer {
  static pdfOptions: PDFOptions = {
    orientation: 'p',
    format: 'a4',
    unit: 'pt',
  };
  static html2canvasOptions: Html2CanvasOptions = {
    scale: window.devicePixelRatio || 2,
    useCORS: true,
    allowTaint: true,
    x: 0,
    y: 0,
  };
  static size = {
    a3: [841.89, 1190.55],
    a4: [595.28, 841.89],
    a5: [419.53, 595.28],
  }

  public pdf: JSPDF;
  public paperWidth: number;
  public paperHeight: number;
  public safeAreaPaperWidth: number;
  public safeAreaPaperHeight: number;
  public safeAreaPadding: [number, number];
  public ignoreTagNames = new Set<string>(['script', 'link', 'style', 'colgroup', 'col', 'td']);
  public ignoreNodes = new WeakSet<HTMLElement>();

  constructor(orientation?: PDFOptions['orientation'], format?: 'a3' | 'a4' | 'a5', padding = [30, 20]) {
    const opts = Object.assign({}, Printer.pdfOptions, { orientation, format });
    this.pdf = new JSPDF(opts);
    if (orientation === 'p' || orientation === 'portrait') {
      [this.paperWidth, this.paperHeight] = Printer.size[format || 'a4'];
    } else {
      [this.paperHeight, this.paperWidth] = Printer.size[format || 'a4'];
    }
    this.safeAreaPadding = padding as [number, number];
    this.safeAreaPaperWidth = this.paperWidth - padding[1] * 2;
    this.safeAreaPaperHeight = this.paperHeight - padding[0] * 2;
  }

  addIgnoreNodes(node: HTMLElement) {
    this.ignoreNodes.add(node);
  }

  addIgnoreTagNames(tagName: string) {
    this.ignoreTagNames.add(tagName);
  }

  // 验证节点是否是有效的节点
  validateNode(node: HTMLElement) {
    if (this.ignoreTagNames.has(node.nodeName.toLowerCase())) return false;
    if (this.ignoreNodes.has(node)) return false;
    const { height, display, position, visibility, clip } = window.getComputedStyle(node);
    if (height === '0px') return false;
    if (display === "none") return false;
    if ((position === 'absolute' || position === 'fixed') && visibility === 'hidden') return false;
    if ((position === 'absolute' || position === 'fixed') && clip === 'rect(0px, 0px, 0px, 0px)') return false;

    return true;
  }

  // 判断该节点是否可再分割为更小的节点
  indivisibleNode(node: HTMLElement) {
    const { nodeType, childElementCount } = node;
    if (nodeType !== 1 && nodeType !== 9) return true;

    if ((nodeType === 1 || nodeType === 9) && childElementCount <= 0) return true;

    if (node.hasAttribute("data-indivisible-node")) return true;

    const nodeName = node.nodeName.toLowerCase();

    return (
      nodeName === "td" ||
      nodeName === "tr" ||
      nodeName === "th" ||
      nodeName === "svg" ||
      nodeName === 'image' ||
      nodeName === 'audio' ||
      nodeName === 'video' ||
      nodeName === 'input' ||
      nodeName === 'radio' ||
      nodeName === 'label' ||
      nodeName === 'button' ||
      nodeName === 'select' ||
      nodeName === 'canvas' ||
      nodeName === 'checkbox' ||
      nodeName === 'textarea'
    );
  }

  getOffsetTop(element: HTMLElement) {
    let offsetTop = element.offsetTop;
    let parent: any = element.offsetParent;
    while (parent) {
      offsetTop += parent.offsetTop;
      offsetTop += parseInt(getComputedStyle(parent).getPropertyValue("border-top-width")) | 0;
      parent = parent.offsetParent;
    }
    return offsetTop;
  }

  computePagination(container: HTMLElement, limitHeight: number) {
    const pos = [0];
    const _this = this;
    const { offsetHeight } = container;
    if (limitHeight >= offsetHeight) return pos;

    const origin = { x: 0, y: this.getOffsetTop(container) };

    completeUnitOfWork(container.firstElementChild);
    return pos;

    function completeUnitOfWork (unitOfWork: any) {
      let node = unitOfWork;

      /**
       * 验证当前节点是否为一个有效的元素节点
       * 如果不是一个有效的元素节点，则查看当前节点的下一个兄弟元素节点
       * 如果当前节点的下一个兄弟元素节点存在并是一个有效的节点，则跳过 while 循环，否则继续。
      */
      while (!_this.validateNode(node)) {
        while (node.nextElementSibling === null) {
          node = node.parentNode;
          if (node === container) return;
        }
        node = node.nextElementSibling;
      }

      const offsetTop = _this.getOffsetTop(node);
      const height = node.offsetHeight;
      const distance = offsetTop - origin.y;

      if (distance > limitHeight) {
        completeWork(node);
      } else if (distance + height > limitHeight) {
        if (_this.indivisibleNode(node)) {
          completeWork(node);
        } else {
          completeUnitOfWork(node.firstElementChild);
        }
      } else {
        while (!node.nextElementSibling) {
          node = node.parentNode;
          if (node === container) return;
        }
        completeUnitOfWork(node.nextElementSibling);
      }
    }

    function completeWork (node: any) {
      let offsetTop;
      let height;
      let distance;

      do {
        while (node.previousElementSibling === null) {
          node = node.parentNode;
          if (node === container) return;
        }

        node = node.previousElementSibling;

        /**
         * 验证节点是否有效
         * 如果当前节点无效，则查找该节点的上一个兄弟元素节点，
         * 如果当前节点是第一个元素节点，则查找该节点的父节点的上一个兄弟元素节点。
        */
        while (!_this.validateNode(node)) {
          while (node.previousElementSibling === null) {
            node = node.parentNode;
            // 终止条件
            if (node === container) return;
          }
          node = node.previousElementSibling;
        }

        offsetTop = _this.getOffsetTop(node);
        height = node.offsetHeight;
        distance = offsetTop - origin.y;

        /**
         * 如果当前节点仍然属于是一个跨页的节点，则查看当前节点的子节点，
         * 如果当前节点没有子节点，则走外层的 do...while 循环，
         * 从该节点下的最后一个元素子节点开始遍历，然后依次查找它的上一个兄弟元素节点。
        */
        while (distance + height > limitHeight && !_this.indivisibleNode(node)) {
          node = node.lastElementChild;

          let isBreak = false;
          /**
           * 验证当前的元素节点是否为有效节点，
           * 如果当前节点不是一个有效节点，则查看依次查找它的上一个兄弟元素节点，
           * 如果当前元素节点是父节点下的第一个元素节点，则结束此 while 循环（包含上一层的 while 循环），
           * 此时，回到最外层的 do...while 循环。
          */
          while (!_this.validateNode(node)) {
            if (node.previousElementSibling === null) {
              node = node.parentNode;
              isBreak = true;
              break;
            }
            node = node.previousElementSibling;
          }
          // 回到外层的 do...while 循环。
          if (isBreak) break;

          offsetTop = _this.getOffsetTop(node);
          height = node.offsetHeight;
          distance = offsetTop - origin.y;
        }
      } while (distance + height > limitHeight)

      pos.push(pos[pos.length - 1] + distance + height);
      origin.y = offsetTop + height;

      while (node.nextElementSibling === null) {
        node = node.parentNode;
        if (node === container) return;
      }
      completeUnitOfWork(node.nextElementSibling);
    }
  }

  async print(element: HTMLElement, printPageNumber = true) {
    const canvas = await html2canvas(element, Printer.html2canvasOptions);
    document.body.appendChild(canvas);
    const imageData = canvas.toDataURL('jpeg', 1.0);
    const { width: canvasWidth, height: canvasHeight } = canvas;

    console.log(canvasWidth, canvasHeight);
    console.log(this.paperWidth, this.paperHeight);

    const scale = Printer.html2canvasOptions.scale;
    // 一页 PDF 的高度换算成 canvas 画布的高度是多少？？？
    // safeAreaPaperWidth:safeAreaPaperHeight = canvasWidth:$H
    // 这里要除以 scale，因为 html2canvas 绘制的内容是实际 HTML 内容的 scale 倍大小。所以这里要除以 scale
    const $H = canvasWidth / this.safeAreaPaperWidth * this.safeAreaPaperHeight / scale;

    // canvas 高度换算成 PDF 要打印的高度（这里是相对 safeAreaPaperWidth 进行计算）
    const contentWidth = this.safeAreaPaperWidth;
    // contentWidth:contentHeight = canvasWidth:canvasHeight
    const contentHeight = contentWidth * canvasHeight / canvasWidth;

    let count = 0;
    // 比例换算，(item * scale):canvasHeight = pos:contentHeight
    const pos = this.computePagination(element, $H).map(item => item * scale / canvasHeight * contentHeight);

    do {
      this.pdf.addImage(
        imageData,
        'JPEG',
        this.safeAreaPadding[1],
        this.safeAreaPadding[0] - pos[count++],
        contentWidth,
        contentHeight,
      );

      this.pdf.setFillColor('#fff');
      this.pdf.rect(0, 0, this.paperWidth, this.safeAreaPadding[0], 'F');
      if (count < pos.length) {
        const height = pos[count] - pos[count - 1];
        this.pdf.rect(
          0,
          this.safeAreaPadding[0] + height,
          this.paperWidth,
          this.paperHeight - height,
          'F',
        );
      }

      // 打印页码
      if (printPageNumber) {
        this.pdf.setTextColor('#999');
        this.pdf.setFontSize(11);
        this.pdf.text(
          `———————— ${count}/${pos.length} ————————`,
          this.paperWidth / 2,
          this.paperHeight - 0.5 * this.safeAreaPadding[0],
          { align: 'center', baseline: 'middle' },
        );
      }
      // 添加一页，并将焦点移到新页上。
      this.pdf.addPage();
    } while (count < pos.length)

    this.pdf.deletePage(count +1);
    this.pdf.save();
    document.body.removeChild(canvas);
    return true;
  }
}
