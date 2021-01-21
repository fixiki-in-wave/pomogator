import { LitElement, customElement, property, TemplateResult, html, Wave, MetaWave, metaString } from '../wave-elements/elements';

export interface WaveElement extends LitElement {
  new (metadata?: MetaWave):WaveElement;
  create(metadata: MetaWave): Promise<HTMLElement>;
  make(metadata?: MetaWave): HTMLElement;
  lit(metadata?: MetaWave): TemplateResult;
  stamp(metaString: metaString): string;

  s$(id: string): Element | null;
  s$$(selector: string): NodeListOf<Element> | null;
  
  // _metadata: MetaWave;
}

@customElement( 'wave-element' )
export class WaveElement extends LitElement implements WaveElement {
  @property({attribute: false }) renderType: string = 'shadow';
  @property({attribute: false }) templateString: string = `<slot><${this.tagName}></slot>`;

  constructor() {
    super();
    // if (metadata && metadata.tagName) Wave.applyMetadata(this, metadata);
    // console.log(`WaveElement.constructor(metadata) for \n`, metadata)
  }
  
  createRenderRoot() {
    return (this.renderType === 'light') ? this : this.attachShadow( {mode: 'open'} );
  }

  connectedCallback() {
    super.connectedCallback();
    console.info(` + <${this.tagName.toLowerCase()}> connected`);
  }

  disconnectedCallback() {
    console.info(` - <${this.tagName.toLowerCase()}> disconnected`);
    super.disconnectedCallback();
  }

  get template() {
    return html`${this.templateString ? this.templateString : `<slot><${this.tagName}></slot>`}`
  }

  s$( id:string ): Element | null {
    if (typeof id !== 'string') return null;
    return this.shadowRoot ? this.shadowRoot.getElementById(id) : this.querySelector(`#${id}`)
  }

  s$$(selector: string): NodeListOf<Element> | null {
    if (typeof selector !== 'string') return null;
    return this.shadowRoot ? this.shadowRoot.querySelectorAll(selector) : this.querySelectorAll(selector)
  }
  
  async create(metadata: MetaWave): Promise<HTMLElement> {
    return Wave.create(metadata)
  }

  make(metadata: MetaWave): HTMLElement {
    try {
      let result = Wave.make(metadata);
      return result
    } catch (error) {
      console.error(error, ` - <${this.tagName.toLowerCase()}>.make() error\n`, metadata);
      throw new Error(`<${this.tagName.toLowerCase()}>.make() error`)
    }
  }

  lit(metadata: MetaWave): TemplateResult {
    try {
      let result = html`${this.make(metadata)}`;
      return result
    } catch (error) {
      console.error(error, ` - <${this.tagName.toLowerCase()}>.lit() error\n`, metadata);
      throw new Error(`<${this.tagName.toLowerCase()}>.lit() error`)
    }
  }

  stamp(metaString: metaString): string {
    try {
      let { template = '', data = {} } = metaString;
      let result = Wave.stamp(template, data);
      return result
    } catch (error) {
      console.error(` - error - <${this.tagName.toLowerCase()}> stamp(${metaString})\n`, error);
      throw new Error(`<${this.tagName.toLowerCase()}>.stamp() error`)
    }
  }

  render(): TemplateResult {
    return html`${this.template}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wave-element': WaveElement;
  }
}
