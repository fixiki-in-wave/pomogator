import { Wave, MetaWave } from './wave';
console.log(`Welcome to Wave...`);
// @ts-ignore 
window.Wave = Wave;



const layoutStyle: MetaWave = {
  tagName: 'link',
  attributes: {
    rel: {  type: 'string', value: 'stylesheet' },
    type: { type: 'string', value: 'text/css'   },
    href: { type: 'string', value: '/css/layout.css' },
  }
};

const layout: MetaWave = {
  tagName: 'wave-element',
  dependencies: [
    { tagName: 'wave-element', moduleSrc: '@wave/element' }    
  ],
  attributes: {
    active: { type: 'boolean', value: true }
  },
  properties: {
    templateString : {
      type: 'string',
      value: `<header>Тут будет заголовок</header>
    <nav>Тут будет панель навигации</nav>
    <main>Тут будет основной контент</main>
    <aside>Тут будет панель информации</aside>
    <footer>Тут будет подвал</footer>`
    }
  }
};

 const waveguide: MetaWave = {
   tagName: 'section',
   properties: { id: { type: 'string', value: 'wave' } },
   style: { type: 'CSSStyleDeclaration', value: { 
     display: 'none' 
    } 
  },
   children: { type: 'template', value: `<link rel="stylesheet" href="./_wave/waveguide.css"><slot name="header"></slot><slot name="nav"></slot><slot name="main"></slot><slot name="info"></slot><slot name="footer"></slot>`}

 }

// @ts-ignore 
const meta = window.meta = { layout, layoutStyle, waveguide };
// // @ts-ignore 
// meta.layout = layoutMeta;
// // @ts-ignore 
// meta.layoutStyle = layoutStyleMeta;
// @ts-ignore 
// Wave.append(document.head, meta.layoutStyle)
// @ts-ignore 
// Wave.append(document.body, meta.layout);

