const templates = new Map<TemplateStringsArray, Template>();

const templateInstances = new WeakMap<Node, TemplateInstance>();

export const dump = () => {
  console.log('templates', templates);
  console.log('template instances', templateInstances);
};

export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  let template = templates.get(strings);
  if (template === undefined) {
    template = new Template(strings);
    templates.set(strings, template);
  }
  return new TemplateResult(template, values);
}

export class TemplateResult {
  template: Template;
  values: any[];

  constructor(template: Template, values: any[]) {
    this.template = template;
    this.values = values;
  }

  renderTo(container: Element | DocumentFragment) {
    let instance = templateInstances.get(container);
    if (instance === undefined) {
      instance = new TemplateInstance(this.template);
      templateInstances.set(container, instance);
      instance.appendTo(container, this.values);
    } else {
      instance.update(this.values);
    }
  }
}

const exprMarker = '{{}}';

export interface PartBase {
  type: string;
  index: number;
}

export interface AttributePart extends PartBase {
  type: 'attribute';
  name: string;
  strings: string[];
}

export interface NodePart extends PartBase {
  type: 'node';
}

export type Part = NodePart | AttributePart;

export class Template {
  private _strings: TemplateStringsArray;
  parts: Part[] = [];
  element: HTMLTemplateElement;

  constructor(strings: TemplateStringsArray) {
    this._strings = strings;
    this._parse();
  }

  private _parse() {
    this.element = document.createElement('template');
    this.element.innerHTML = this._getTemplateHtml(this._strings);
    const walker = document.createTreeWalker(this.element.content, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let index = -1;
    while (walker.nextNode()) {
      index++;
      const node = walker.currentNode;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const attributes = (node as any).attributes;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes.item(i);
          const value = attribute.value;
          const strings = value.split(exprMarker);
          if (strings.length > 1) {
            this.parts.push({
              type: 'attribute',
              name: attribute.name,
              index,
              strings,
            });
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const strings = node.nodeValue!.split(exprMarker);
        if (strings.length > 1) {
          for (let i = 0; i < strings.length; i++) {
            const string = strings[i];
            const literalNode = new Text(string);
            node.parentNode!.insertBefore(literalNode, node);
            index++;
            if (i < strings.length - 1) {
              const partNode = new Text();
              node.parentNode!.insertBefore(partNode, node);
              this.parts.push({ type: 'node', index: index++ });
            }
          }
          node.parentNode!.removeChild(node);
          index--;
        }
      }
    }
  }

  private _getTemplateHtml(strings: TemplateStringsArray): string {
    const parts = [];
    for (let i = 0; i < strings.length; i++) {
      parts.push(strings[i]);
      if (i < strings.length - 1) {
        parts.push(exprMarker);
      }
    }
    return parts.join('');
  }
}

export class TemplateInstance {
  private _template: Template;
  private _parts: { part: Part; node: Node }[] = [];
  private _startNode: Node;
  private _endNode: Node;

  constructor(template: Template) {
    this._template = template;
  }

  appendTo(container: Element | DocumentFragment, values: any[]) {
    const fragment = this._clone();
    this.update(values);
    container.appendChild(fragment);
  }

  private _getFragment() {
    const fragment = this._clone();
    this._startNode = fragment.insertBefore(new Text(), fragment.firstChild);
    this._endNode = fragment.appendChild(new Text());
    return fragment;
  }

  private _clone(): DocumentFragment {
    const fragment = document.importNode(this._template.element.content, true);

    if (this._template.parts.length > 0) {
      const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);

      const parts = this._template.parts;
      let index = -1;
      let partIndex = 0;
      let part = parts[0];

      while (walker.nextNode() && partIndex < parts.length) {
        index++;
        if (index === part.index) {
          const node = walker.currentNode;
          this._parts.push({ part, node });
          part = parts[++partIndex];
        }
      }
    }
    return fragment;
  }

  update(values: any[]) {
    let valueIndex = 0;
    for (const { part, node } of this._parts) {
      if (part.type === 'attribute') {
        console.assert(node.nodeType === Node.ELEMENT_NODE);
        const strings = part.strings;
        let text = '';
        for (let i = 0; i < strings.length; i++) {
          text += strings[i];
          if (i < strings.length - 1) {
            text += values[valueIndex++];
          }
        }
        (node as Element).setAttribute(part.name, text);
      } else {
        console.assert(node.nodeType === Node.TEXT_NODE);

        const value = this.getValue(values[valueIndex++]);

        if (value && typeof value !== 'string' && value[Symbol.iterator]) {
          const fragment = document.createDocumentFragment();
          for (const item of value) {
            const marker = new Text();
            fragment.appendChild(marker);
            this._renderValue(item, marker);
          }
          this._renderValue(fragment, node);
        } else {
          this._renderValue(value, node);
        }
      }
    }
  }

  getValue(value: any): any {
    while (typeof value === 'function') {
      try {
        value = value();
      } catch (e) {
        console.error(e);
        return;
      }
    }
    return value;
  }

  private _renderValue(value: any, node: Node) {
    let templateInstance = node.__templateInstance as TemplateInstance;
    if (
      templateInstance !== undefined &&
      (!(value instanceof TemplateResult) || templateInstance._template !== value.template)
    ) {
      this._cleanup(node);
    }

    if (value instanceof DocumentFragment) {
      node.parentNode!.insertBefore(value, node.nextSibling);
    } else if (value instanceof TemplateResult) {
      if (templateInstance === undefined || value.template !== templateInstance._template) {
        node.textContent = '';
        templateInstance = node.__templateInstance = new TemplateInstance(value.template);
        const fragment = templateInstance._getFragment();
        node.parentNode!.insertBefore(fragment, node.nextSibling);
      }
      templateInstance.update(value.values);
    } else {
      node.textContent = value;
    }
  }

  private _cleanup(node: Node) {
    const instance = node.__templateInstance!;

    let cleanupNode: Node | null = instance._startNode;
    while (cleanupNode !== null) {
      const n = cleanupNode;
      cleanupNode = cleanupNode.nextSibling;
      n.parentNode!.removeChild(n);
      if (cleanupNode === instance._endNode) {
        break;
      }
    }
    node.__templateInstance = undefined;
  }
}

declare global {
  interface Node {
    __templateInstance?: TemplateInstance;
    __startMarker?: Node;
  }
}
