export interface IWave {
  new(metadata: MetaWave): HTMLElement;
  create(metadata: MetaWave): Promise<HTMLElement>;
  make(metadata: MetaWave): HTMLElement;
  applyMetadata(element: HTMLElement, metadata: MetaWave): HTMLElement;
  stamp(templateString: string, data: object ): string;
  append(element: HTMLElement, metadata: MetaWave): void;
  prepend(element: HTMLElement, metadata: MetaWave): void;
}

export type metaString = { template: string; data?: object };
export type childrenType = 'html'|'metaString'|'metadata'|'template';
export type propertyType = 'string'|'object'|'JSON'|'Symbol'|'Map'|'WeakMap'|'Set'|'WeakSet';
export type styleType = 'css'|'CSSStyleDeclaration';


export type MetaWave = {
  name?: string;
  description?: string;
  tagName: string;
  moduleSrc?: string;
  dependencies?: DependencyMeta[] | [];
  className?: string;
  properties?: { [propertyName:  string]: PropertyMeta  };
  attributes?: { [attributeName: string]: AttributeMeta };
  children?: ChildrenMeta;
  style?: StyleMeta;
  // methods?: { [methodName:  string]: MethodMeta  };
  // events?:  { [eventName:   string]: EventMeta   };
}

export type ChildrenMeta = {
  type: childrenType;
  value: string|metaString|MetaWave[]
}

export type StyleMeta = {
  type: styleType;
  value: string|CSSStyleDeclaration|any;
}

export type DependencyMeta = {
  tagName: string;
  moduleSrc: string;
}

export type AttributeMeta = {
  // name: string;
  type: string;
  description?: string;
  value?: string | boolean;
}

export type PropertyMeta = {
  // name: string;
  type: propertyType;
  description?: string;
  value?: any;
}




const customElementsRE = new RegExp('\w*-\w*');

const banned: string[] = [
  'tagName', 'className', 'style', 'data',
  'innerHTML', 'innerText', 'outerHTML', 'outerText', 
  'children', 'firstChild', 'onclick',
  'render'
];

const isAllowed = (property: string): boolean => !banned.includes(property);

export class Wave {

  constructor(metadata: MetaWave) {
    return Wave.make(metadata);
  }

  static make(metadata: MetaWave): HTMLElement {
    const { tagName = 'div' } = metadata || {};
    let element;
    
    if (customElementsRE.test(tagName)) {
      let elementClass = customElements.get(tagName);

      if (elementClass === undefined) {
        Wave.create(metadata).then( element => element).catch( () => {
          element = document.createElement('div');
          return Wave.applyMetadata(element, metadata)
        })
      } 
    }

    element = document.createElement(tagName);
    return Wave.applyMetadata(element, metadata);
  }

  static async create(metadata: MetaWave): Promise<HTMLElement> {
    const { tagName = 'div', moduleSrc = '', dependencies = [] } = metadata || {};

    if (customElementsRE.test(tagName)) {
      let elementClass = customElements.get(tagName);
      if (elementClass === undefined) {
        const components = [{ tagName, moduleSrc }, ...dependencies];
        try {
          // ожидание импорта элементов
          await Promise.all(components.map(c => {
            if (c.moduleSrc) import(c.moduleSrc)
          }));
          // ожидание регистрации элементов
          await Promise.all(
            components.map(c => customElements.whenDefined(c.tagName))
          );
          elementClass = customElements.get(tagName);
          if (elementClass === undefined)
            console.error(`<Wave.load> Not found constructor for <${tagName}>`);
        } catch (error) {
          console.error(
            `Ошибка импорта элемента <${tagName}> из ${moduleSrc}\n`,
            error
          );
        }
      }
    }
    const element = document.createElement(tagName);
    return Wave.applyMetadata(element, metadata);
  }

  static applyMetadata(element: HTMLElement, metadata: MetaWave ): HTMLElement {
    if (element instanceof HTMLElement) {
      const { className = '', attributes = {}, properties = {}, style, children } = metadata;

      if (typeof className === 'string' && className.trim()  !== '' ) element.className = className.trim();

      Object.keys(attributes).filter( isAllowed ).forEach(( name:string ) => {
        if (typeof name !== 'string') { return };
        const { type, value } = attributes[name];
        (type !== 'boolean')
          ? value ? element.setAttribute(name, String(value) ) : element.removeAttribute(name)
          : value ? element.setAttribute(name, '') : element.removeAttribute(name);
      });

      Object.keys(properties).filter( isAllowed ).forEach(( name:string ) => {
        if (typeof name !== 'string') { return };
        const { value, type } = properties[name];

        if (name === 'dataset') {
          try {
            Object.keys(value).forEach( dataAttr => {
              element.dataset[dataAttr] = value[dataAttr]
            })
          } catch (error) {
            console.error(`Error on dataset property ${name}; `) 
          }
        } else {
          try {
            switch (type) {
              case 'Map':
                // @ts-ignore 
                element[name] = new Map(value); 
                break;
              case 'WeakMap':
                // @ts-ignore 
                element[name] = new WeakMap(value);
                break;
              case 'Set':
                // @ts-ignore 
                element[name] = new Set(value);
                break;
              case 'WeakSet':
                // @ts-ignore 
                element[name] = new WeakSet(value);
                break;
              case 'Symbol':
                // @ts-ignore 
                element[name] = Symbol(value);
                break;
              case 'JSON':
                // @ts-ignore 
                element[name] = JSON.parse(value);
                break;
  
              default:
                // @ts-ignore 
                element[name] = value;
                break;
            }    
          } catch (error) {
            console.error(`Error on property ${name}; `)
          }
        }
      });

      if (style && style.type) {
        const { type, value } = style;
        if (value && typeof type === 'string') {
          switch (type) {
            case 'css':
              if (typeof value === 'string' && value.trim() !== '' ) {
                element.style.cssText = value
              };
              break;
            case 'CSSStyleDeclaration':
              if (typeof value === 'object') {
                for (let [rule, css] of Object.entries(value)) {
                  // @ts-ignore 
                  if (typeof css === 'string' && css.trim() !== '') element.style[rule] = css;
                }
              }
              break;
          }
        }
      }

      if (children && children.type) {
        const { type, value } = children;

        switch (type) {
          case 'template':
            let children = '';
            if (typeof value === 'string' && value.trim() !== '' ) {
              children = value
            };
            // @ts-ignore 
            if (value.template && value.data ) {
            // @ts-ignore 
              children =  Wave.stamp(value.template, value.data)
            };

            // @ts-ignore 
            element.template = new Wave({tagName: 'template', children: { type: 'html', value: children }});
            break;
          case 'html':
            if (typeof value === 'string' && value.trim() !== '' ) {
              element.innerHTML = value;
            }
            break;
          case 'metaString':
            const { template, data } = value as metaString;
            if (typeof template === 'string' && typeof data === 'object' ) {
              element.innerHTML = Wave.stamp(template, data);
            }
            break
          case 'metadata':
            if (Array.isArray(value)) {

              value.forEach( childMetadata => {
                const child = Wave.make(childMetadata);
                element.appendChild(child)
              })
            }
            break
          default:
            break;
        }
        
      }
      
      return element
    } else {
      return element
    }
  }

  static stamp(template: string, data: object = {}): string {
    try {
      let result = new Function(`return \`${template.replace(' ${',' ${this.')}\`;`).call(data);
      return result
    } catch (error) {
      console.error(`Wave.stamp() error\n`, error, template, data);
      throw new Error(`Wave.stamp() error`)
    }
  }

  static append(parent: HTMLElement, metadata: MetaWave ): void {
    Wave.create(metadata).then( element => parent.append( element ));
  }

  static prepend(parent: HTMLElement, metadata: MetaWave ): void {
    Wave.create(metadata).then( element => parent.prepend( element ));
  }
}
