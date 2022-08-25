import { observable, effect, html, dump } from './dist/index.js';

// const Counter = ({ count }) => {
//   return html`<div>
//     <h1>My awesome counter</h1>
//     <p>Count: ${count}</p>
//   </div>`;
// };

// const [count, setCount] = observable(0);

// window.increment = () => {
//   setCount(count() + 1);
// };

// const App = () => {
//   return html`<div>
//     ${Counter({ count: count() })}
//     <button onclick="increment()">+</button>
//   </div>`;
// };

// const container = document.body;

// effect(() => {
//   console.log('---------------');
//   dump();
//   App().renderTo(container);
//   dump();
//   console.log('-----end------');
// });

// let count = 0;
// const exprMarker = '{{}}';

// const nodes = [];
// const something = (strings, ...values) => {
//   const element = document.createElement('template');
//   element.innerHTML = strings.join(exprMarker);
//   const walker = document.createTreeWalker(element.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
//   let nextNode = walker.nextNode();

//   while (nextNode) {
//     const currentNode = walker.currentNode;

//     if (currentNode.nodeType === Node.TEXT_NODE) {
//       console.log(values);
//       currentNode.textContent = currentNode.textContent.replace(exprMarker, values.shift());
//       nodes.push(currentNode);
//     } else {
//     }
//     nextNode = walker.nextNode();
//   }

//   return element;
// };

// let initialRender = true;
// const render = (template, container) => {
//   if (initialRender) {
//     container.appendChild(template.content);
//     initialRender = false;
//   }

//   nodes[0].textContent = count;
// };

// const element = something`<div id="foo"><p>Marry</p><p>${count}</p></div>`;
// render(element, document.body);
// count = 1;

// setInterval(() => {
//   count++;
//   render(element, document.body);
// }, 3000);

// const render = (element, container) => {
//   let stringRepresentation = element[0];
//   const values = element[1];

//   for (let value of values) {
//     stringRepresentation = stringRepresentation.replace('{{}}', value);
//   }

//   console.log(stringRepresentation);

//   if (initialRender) {
//     container.innerHTML = stringRepresentation;
//     initialRender = false;
//   } else {
//   }
// };

let count = 0;
const element = () => html`<div id="foo">
  <p>Marry</p>
  <p>${count}</p>
</div>`;

element(count).renderTo(document.body);

setInterval(() => {
  count = Math.random();
  element(count).renderTo(document.body);
}, 3000);
