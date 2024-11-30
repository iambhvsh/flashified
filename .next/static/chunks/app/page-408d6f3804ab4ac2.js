(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{8679:function(e,t,a){Promise.resolve().then(a.bind(a,6859)),Promise.resolve().then(a.bind(a,8979))},6859:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return c}});var l=a(4297),i=a(3812),s=a(2481),r=a(1965),o=a(8449);function c(){let[e,t]=(0,i.useState)(!1);return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)("div",{className:"flex items-center justify-between mb-8",children:[(0,l.jsxs)("div",{className:"flex items-center gap-2",children:[(0,l.jsx)(s.Wqx,{className:"text-2xl text-primary-500"}),(0,l.jsx)("h1",{className:"text-2xl font-medium text-white/90",children:"Flashified"})]}),(0,l.jsx)(r.E.button,{className:"p-2 text-white/70 hover:text-white/90 transition-colors",onClick:()=>t(!0),whileHover:{scale:1.05},whileTap:{scale:.95},children:(0,l.jsx)(s.H33,{className:"text-xl"})})]}),(0,l.jsx)(o.M,{children:e&&(0,l.jsx)(r.E.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm",children:(0,l.jsxs)(r.E.div,{initial:{scale:.9,opacity:0},animate:{scale:1,opacity:1},exit:{scale:.9,opacity:0},className:"relative bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl",children:[(0,l.jsx)(r.E.button,{onClick:()=>t(!1),className:"absolute top-4 right-4 text-white/70 hover:text-white/90",whileHover:{scale:1.1},whileTap:{scale:.9},children:(0,l.jsx)(s.q5L,{className:"text-xl"})}),(0,l.jsx)("h2",{className:"text-xl font-medium text-white mb-4",children:"About Flashified"}),(0,l.jsx)("p",{className:"text-white/70 mb-4",children:"A powerful bulk image downloader and search tool created by Bhavesh Patil."}),(0,l.jsxs)("div",{className:"flex gap-4",children:[(0,l.jsx)(r.E.a,{href:"https://github.com/iambhvsh/flashified",target:"_blank",rel:"noopener noreferrer",className:"text-primary-500 hover:text-primary-400",whileHover:{scale:1.05},whileTap:{scale:.95},children:"GitHub"}),(0,l.jsx)(r.E.a,{href:"https://iambhvsh.vercel.app",target:"_blank",rel:"noopener noreferrer",className:"text-primary-500 hover:text-primary-400",whileHover:{scale:1.05},whileTap:{scale:.95},children:"Portfolio"})]})]})})})]})}},8979:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return x}});var l=a(4297),i=a(3812),s=a(1965),r=a(8449),o=a(2481);function c(e){let{size:t="medium"}=e;return(0,l.jsx)("div",{className:"animate-spin rounded-full border-b-2 border-white ".concat({small:"h-4 w-4",medium:"h-5 w-5",large:"h-6 w-6"}[t])})}var n=a(4717);let d=e=>{let{src:t,alt:a="",...s}=e,[r,o]=(0,i.useState)(!1);return r?(0,l.jsx)(n.default,{src:"https://placehold.co/600x400/1f2937/38bdf8?text=Image+Not+Found",alt:"Fallback",className:"object-cover ".concat(s.className||""),...s,width:s.fill?void 0:s.width||300,height:s.fill?void 0:s.height||300}):(0,l.jsx)(n.default,{src:t,alt:a,className:"object-cover ".concat(s.className||""),...s,width:s.fill?void 0:s.width||300,height:s.fill?void 0:s.height||300,quality:s.isThumb?60:100,onError:()=>o(!0),unoptimized:!s.isThumb})},h=async e=>{try{var t,a;let l=await fetch("/api/images/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,quality:"original"})});if(!l.ok)throw Error("Failed to download image");let i=await l.blob(),s=window.URL.createObjectURL(i),r=document.createElement("a");r.href=s;let o=(null===(a=e.url.split(".").pop())||void 0===a?void 0:null===(t=a.match(/^(jpg|jpeg|png|gif|webp)$/i))||void 0===t?void 0:t[0])||"jpg";r.download="".concat(e.filename||"image_".concat(Date.now()),".").concat(o),document.body.appendChild(r),r.click(),window.URL.revokeObjectURL(s),r.remove()}catch(e){console.error("Failed to download image:",e)}},m=async e=>{try{let t=await fetch("/api/images",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({urls:e.map(e=>e.url)})});if(!t.ok)throw Error("Failed to download images");let a=await t.blob(),l=window.URL.createObjectURL(a),i=document.createElement("a");i.href=l,i.download="downloaded_images.zip",document.body.appendChild(i),i.click(),window.URL.revokeObjectURL(l),i.remove()}catch(e){console.error("Failed to download zip:",e)}};function x(){let[e,t]=(0,i.useState)(""),[a,n]=(0,i.useState)(!1),[x,p]=(0,i.useState)([]),[u,b]=(0,i.useState)(!1),[f,w]=(0,i.useState)(!1),g=(0,i.useRef)(null),[v,j]=(0,i.useState)(null),[y,N]=(0,i.useState)(!1);(0,i.useEffect)(()=>()=>{g.current&&g.current.abort()},[]);let k=async t=>{if(t.preventDefault(),e.trim()){g.current&&g.current.abort(),g.current=new AbortController,n(!0),p([]),b(!0),w(!1);try{var a;let t=await fetch("/api/images",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.trim()}),signal:g.current.signal});if(!t.ok)throw Error(await t.text()||"Failed to fetch images");let l=null===(a=t.body)||void 0===a?void 0:a.getReader(),i=new TextDecoder,s="";for(;l&&!f;){let{value:e,done:t}=await l.read();if(t)break;let a=(s+=i.decode(e,{stream:!0})).split("\n");for(let e of(s=a.pop()||"",a))if(e.startsWith("data: "))try{let t=JSON.parse(e.slice(6));if(p(e=>[...e,...t.newImages].slice(0,1e3)),t.crawlStatus.maxImagesReached){w(!0);break}}catch(e){console.warn("Failed to parse update:",e)}}}catch(e){"AbortError"===e.name?console.error("Crawling stopped"):console.error("Failed to fetch images:",e)}finally{n(!1),b(!1),w(!1),g.current=null}}};return(0,l.jsxs)("div",{className:"min-h-screen bg-black text-white",children:[(0,l.jsx)("div",{className:"fixed top-0 left-0 right-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800/50",children:(0,l.jsx)("div",{className:"max-w-7xl mx-auto px-4",children:(0,l.jsxs)("div",{className:"flex flex-col sm:flex-row items-center justify-between py-2 sm:h-14 gap-2 sm:gap-4",children:[(0,l.jsxs)("div",{className:"flex items-center gap-2 w-full sm:w-auto justify-between",children:[(0,l.jsxs)("div",{className:"flex items-center gap-2",children:[(0,l.jsx)(o.Wqx,{className:"text-xl text-primary-500"}),(0,l.jsx)("h1",{className:"text-lg font-medium text-white/90",children:"Flashified"})]}),(0,l.jsx)(s.E.button,{className:"sm:hidden p-2 text-white/70 hover:text-white/90 transition-colors",onClick:()=>N(!0),whileHover:{scale:1.05},whileTap:{scale:.95},children:(0,l.jsx)(o.H33,{className:"text-lg"})})]}),(0,l.jsxs)("div",{className:"flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto",children:[(0,l.jsxs)("form",{onSubmit:k,className:"relative w-full sm:w-96",children:[(0,l.jsx)("input",{type:"url",value:e,onChange:e=>t(e.target.value),placeholder:"Enter website URL...",className:"w-full px-3 py-2 bg-gray-900/50 border border-gray-800/50 rounded-lg focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500 text-white placeholder-gray-500 text-sm",required:!0}),(0,l.jsxs)("div",{className:"absolute right-2 top-1/2 -translate-y-1/2 flex gap-2",children:[u&&(0,l.jsx)("button",{type:"button",onClick:()=>{g.current&&(g.current.abort(),w(!0),b(!1))},className:"px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm",children:"Stop"}),(0,l.jsx)("button",{type:"submit",disabled:a,className:"p-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors",children:a?(0,l.jsx)(c,{size:"small"}):(0,l.jsx)(o.jRj,{className:"text-lg"})})]})]}),(0,l.jsx)(s.E.button,{className:"hidden sm:block p-2 text-white/70 hover:text-white/90 transition-colors",onClick:()=>N(!0),whileHover:{scale:1.05},whileTap:{scale:.95},children:(0,l.jsx)(o.H33,{className:"text-lg"})})]})]})})}),(0,l.jsx)("div",{className:"max-w-7xl mx-auto px-4 sm:px-6",children:(0,l.jsx)("div",{className:"pt-24 sm:pt-20 pb-24",children:(0,l.jsx)("div",{className:"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",children:x.map((e,t)=>(0,l.jsx)("div",{className:"aspect-square relative rounded-lg overflow-hidden bg-gray-900",children:(0,l.jsx)(d,{src:e.url,alt:e.filename||"Image ".concat(t+1),className:"object-cover hover:scale-105 transition-transform duration-200",fill:!0,sizes:"(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",isThumb:!0,onClick:()=>j(e)})},"".concat(e.url,"-").concat(t)))})})}),x.length>0&&(0,l.jsx)("div",{className:"fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 p-4 z-50",children:(0,l.jsxs)("div",{className:"max-w-7xl mx-auto px-6 sm:px-8 flex justify-between items-center",children:[(0,l.jsxs)("span",{className:"text-white/70",children:[x.length," images found"]}),(0,l.jsxs)("button",{onClick:()=>m(x),className:"px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2",children:[(0,l.jsx)(o._hL,{}),"Download All"]})]})}),(0,l.jsx)(r.M,{children:y&&(0,l.jsx)(s.E.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 bg-black/80 backdrop-blur-sm",onClick:()=>N(!1),children:(0,l.jsxs)(s.E.div,{initial:{scale:.9,opacity:0},animate:{scale:1,opacity:1},exit:{scale:.9,opacity:0},className:"relative bg-gray-900 rounded-lg p-8 w-full max-w-md mx-auto shadow-xl",onClick:e=>e.stopPropagation(),children:[(0,l.jsx)(s.E.button,{onClick:()=>N(!1),className:"absolute top-4 right-4 text-white/70 hover:text-white/90",whileHover:{scale:1.1},whileTap:{scale:.9},children:(0,l.jsx)(o.q5L,{className:"text-xl"})}),(0,l.jsx)("h2",{className:"text-xl font-medium text-white mb-4",children:"About Flashified"}),(0,l.jsx)("p",{className:"text-white/70 mb-4",children:"A powerful bulk image downloader and search tool created by Bhavesh Patil."}),(0,l.jsxs)("div",{className:"flex gap-4",children:[(0,l.jsx)(s.E.a,{href:"https://github.com/iambhvsh/flashified",target:"_blank",rel:"noopener noreferrer",className:"text-primary-500 hover:text-primary-400",whileHover:{scale:1.05},whileTap:{scale:.95},children:"GitHub"}),(0,l.jsx)(s.E.a,{href:"https://iambhvsh.vercel.app",target:"_blank",rel:"noopener noreferrer",className:"text-primary-500 hover:text-primary-400",whileHover:{scale:1.05},whileTap:{scale:.95},children:"Portfolio"})]})]})})}),(0,l.jsx)(r.M,{children:v&&(0,l.jsx)(s.E.div,{initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95",onClick:()=>j(null),children:(0,l.jsxs)(s.E.div,{initial:{scale:.9,opacity:0},animate:{scale:1,opacity:1},exit:{scale:.9,opacity:0},className:"relative w-full h-full flex flex-col items-center justify-center gap-4",onClick:e=>e.stopPropagation(),children:[(0,l.jsxs)("div",{className:"relative",children:[(0,l.jsx)("img",{src:v.url,alt:v.filename||"Full size image",className:"max-w-full max-h-[80vh] object-contain rounded-lg"}),(0,l.jsx)(s.E.button,{className:"absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white/70 hover:text-white",onClick:()=>j(null),whileHover:{scale:1.1},whileTap:{scale:.9},children:(0,l.jsx)(o.q5L,{className:"text-xl"})})]}),(0,l.jsxs)("button",{onClick:e=>{e.stopPropagation(),h(v)},className:"px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2",children:[(0,l.jsx)(o._hL,{}),"Download Original"]})]})})})]})}}},function(e){e.O(0,[720,658,681,452,744],function(){return e(e.s=8679)}),_N_E=e.O()}]);