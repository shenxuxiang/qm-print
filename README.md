# qm-print

## Installation

```bash
npm install qm-print

yarn add qm-print
```


## Usage

```js
import React from 'react';
import Printer from 'qm-print';

export default function App() {
  const handlePrint() => {
    new printer = new Printer('p', 'a4', [40, 25]);
    printer.print(document.getElementById('root'), false)
        .then(() => {
            console.log('print successed');
        })
        .catch((error) => {
            console.log(error);
        });
  }

  return (
    <div>
      <button onClick={handlePrint}>预览</button>
    </div>
  );
}
```

## 构造函数参数

| param            | detail                                         | type     | default          |
| ---------------- | -----------------------------------------------| -------- | -------          |
| oriention        | printing direction，value range: 'portrait', 'landscape', "p", "l"  | string   | "p"             |
| format           | paper size, value range: "a3", "a4", "a5"      | string   | "a4"             |
| padding          | offset in vertical and horizontal directions   | [number, number] | [30, 20] |


## print(container, printPageNumber)

执行打印动作，支持分页打印（当内容大于设定的 format 纸张高度时），返回值: `Promise<boolean>`

- container 表示一个 DOM 节点容器，该节点下的所有内容将会被打印

- printPageNumber 表示是否在每一页的页脚打印页码。默认值 true。


## addIgnoreNodes(node)

    该方向将会向 printer 实例对象的 ignoreNodes 属性中添加一个 nodeName。在执行打印时，printer 会遍历 container 容器节点下的所有子孙元素节点，ignoreNodes 中包含的节点将会被忽略。


## addIgnoreTagNames(tagName)

    该方向将会向 printer 实例对象的 ignoreTagNames 属性中添加一个 DOM 节点。在执行打印时，printer 会遍历 container 容器节点下的所有子孙元素节点，ignoreTagNames 中包含的节点将会被忽略。

    printer 默认忽略的节点包含：`script, link, style, colgroup, col, td`


## 打印裁剪

    比如说一张图片，如果这张图片所处的位置刚好处在两个页面之间，那么按照正常的打印逻辑来说，第一页会打印出图片的上半部分，第二页上会打印图片的下半部分。

    printer 打印是不会从一个完整的元素中间进行断页，所以它会从跨页元素的上一个兄弟元素或者父（祖先）节点的上一个兄弟元素的 borderBottom 作为当前页打印的结束位置，同时也作为下一页打印的起始位置。
    
    对此， printer 具体执行策略就是遍历容器节点下的每一个有效的元素节点，并计算他们的位置，如果当前元素节点存在跨页的情况时，printer 会计算该元素节点的 previouseElementSibling (具体如下)，通过这种方式计算来避免跨页打印的情况。

```js
    while (node.previouseElementSibling == null) {
        node = node.parentNode;
        if (node === container) return;
    }
    node = node.previouseElementSibling;
```

   printer 默认不会在以下元素进行断页打印：

```html
    <tr/>
    <th/>
    <svg/>
    <img/>
    <audio/>
    <video/>
    <input/>
    <radio/>
    <label/>
    <button/>
    <select/>
    <canvas/>
    <checkbox/>
    <textarea/>
```
    上面列出的元素节点，在 printer 计算时是不会遍历他们的子孙节点的，所以这里的元素节点将作为一个完整节点打印在一张 PDF 纸张上。

    printer 同时还可以支持用户定义，如果你不希望某个特定的元素节点进行断页打印，那么我们可以给这个节点添加 "data-indivisible-node" 属性。printer
    在遍历元素节点时就不会遍历该节点下的子节点。


## instruction

- 打印时，我们可以选择打印的方向，’portrait‘ 表示竖向打印（简写 ’p‘），’landscape‘ 表示横向打印（简写 ’l‘）。

- 打印的纸张我们可以选择 a3、a4、a5，

- 打印时，如果希望打印内容距离纸张边缘具有一定的偏移量，那么可以通过 padding 参数进行设定，padding[0] 表示 top、bottom 的偏移量，padding[1] 表示 left、right 的偏移量。

- 支持分页，打印时，可以通过给 print() 方法传递第二个参数，来设置是否在每一页的页脚打印页码。
