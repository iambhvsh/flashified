(()=>{var e={};e.id=312,e.ids=[312],e.modules={517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},9491:e=>{"use strict";e.exports=require("assert")},2361:e=>{"use strict";e.exports=require("events")},7147:e=>{"use strict";e.exports=require("fs")},3685:e=>{"use strict";e.exports=require("http")},5687:e=>{"use strict";e.exports=require("https")},1017:e=>{"use strict";e.exports=require("path")},2781:e=>{"use strict";e.exports=require("stream")},6224:e=>{"use strict";e.exports=require("tty")},7310:e=>{"use strict";e.exports=require("url")},3837:e=>{"use strict";e.exports=require("util")},9796:e=>{"use strict";e.exports=require("zlib")},4912:()=>{},7128:(e,t,r)=>{"use strict";r.r(t),r.d(t,{headerHooks:()=>q,originalPathname:()=>L,patchFetch:()=>N,requestAsyncStorage:()=>I,routeModule:()=>_,serverHooks:()=>C,staticGenerationAsyncStorage:()=>z,staticGenerationBailout:()=>M});var a={};r.r(a),r.d(a,{POST:()=>v,PUT:()=>b});var i=r(6084),s=r(8179),n=r(3075),o=r(1945),l=r(5548);let c=require("cheerio"),u=require("jszip");var p=r.n(u);let d=require("crypto");var g=r.n(d),h=r(4430),m=r(4033),f=r.n(m);class w{constructor(e){this.value=e}}class y{#e;#t;#r;constructor(){this.clear()}enqueue(e){let t=new w(e);this.#e?this.#t.next=t:this.#e=t,this.#t=t,this.#r++}dequeue(){let e=this.#e;if(e)return this.#e=this.#e.next,this.#r--,e.value}peek(){if(this.#e)return this.#e.value}clear(){this.#e=void 0,this.#t=void 0,this.#r=0}get size(){return this.#r}*[Symbol.iterator](){let e=this.#e;for(;e;)yield e.value,e=e.next}}function E(e){S(e);let t=new y,r=0,a=()=>{r<e&&t.size>0&&(t.dequeue()(),r++)},i=()=>{r--,a()},s=async(e,t,r)=>{let a=(async()=>e(...r))();t(a);try{await a}catch{}i()},n=(i,n,o)=>{new Promise(e=>{t.enqueue(e)}).then(s.bind(void 0,i,n,o)),(async()=>{await Promise.resolve(),r<e&&a()})()},o=(e,...t)=>new Promise(r=>{n(e,r,t)});return Object.defineProperties(o,{activeCount:{get:()=>r},pendingCount:{get:()=>t.size},clearQueue:{value(){t.clear()}},concurrency:{get:()=>e,set(i){S(i),e=i,queueMicrotask(()=>{for(;r<e&&t.size>0;)a()})}}}),o}function S(e){if(!((Number.isInteger(e)||e===Number.POSITIVE_INFINITY)&&e>0))throw TypeError("Expected `concurrency` to be a number from 1 and up")}let U={TIMEOUT:1e4,MAX_RETRIES:2,CONCURRENT_REQUESTS:10,USER_AGENT:"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",MAX_IMAGES:1e3,IMAGE_SELECTORS:["img[src]","img[data-src]","img[data-lazy-src]","img[data-original]","img[data-lazy]","img[data-url]","img[data-srcset]","picture source[srcset]","picture source[data-srcset]",'[style*="background-image"]','[style*="background"]',"[data-bg]","[data-background]","[data-background-image]","image"],MAX_PAGES_TO_CRAWL:30,RETRY_DELAY:500,IMAGE_EXTENSIONS:[".jpg",".jpeg",".png",".gif",".webp",".bmp",".svg"],STREAM_CHUNK_SIZE:50};async function A(e,t=U.MAX_RETRIES){let r=new AbortController,a=setTimeout(()=>r.abort(),U.TIMEOUT);try{return await l.Z.get(e,{responseType:"arraybuffer",signal:r.signal,headers:{"User-Agent":U.USER_AGENT,Accept:"image/*,*/*","Accept-Encoding":"gzip, deflate, br"},maxRedirects:5,validateStatus:e=>200===e})}catch(r){if(t>0&&r.response?.status!==404)return await new Promise(e=>setTimeout(e,U.RETRY_DELAY)),A(e,t-1);throw r}finally{clearTimeout(a)}}async function R(e){let t={"User-Agent":U.USER_AGENT,Accept:"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8","Accept-Language":"en-US,en;q=0.9","Cache-Control":"no-cache",Pragma:"no-cache","Sec-Fetch-Dest":"document","Sec-Fetch-Mode":"navigate","Sec-Fetch-Site":"none","Sec-Fetch-User":"?1","Upgrade-Insecure-Requests":"1"};try{return(await l.Z.get(e,{headers:t,timeout:U.TIMEOUT,maxRedirects:5,validateStatus:e=>e<500})).data}catch(e){throw console.error("Error fetching page:",e),e}}async function T(e,t){let r=c.load(e),a=new Set,i=e=>{try{let r=function(e,t){try{if(e.startsWith("data:"))return e;if((e=(e=e.split("?")[0]).replace(/{width}/g,"800").replace(/{height}/g,"800").replace(/{size}/g,"800").replace(/{quality}/g,"80").replace(/%7Bwidth%7D/g,"800").replace(/%7Bheight%7D/g,"800").replace(/%7Bsize%7D/g,"800").replace(/%7Bquality%7D/g,"80")).startsWith("//"))e=`https:${e}`;else if(e.startsWith("/")){let r=new URL(t);e=`${r.protocol}//${r.host}${e}`}else e.startsWith("http")||(e=new URL(e,t).toString());return e}catch(e){return console.warn("URL normalization failed:",e),null}}(e,t);r&&function(e){try{let t=new URL(e).pathname.toLowerCase().split(".").pop()||"";return U.IMAGE_EXTENSIONS.includes(`.${t}`)}catch{return!1}}(r)&&a.add(r)}catch(t){console.warn("Failed to process URL:",e,t)}};return U.IMAGE_SELECTORS.forEach(e=>{r(e).each((e,t)=>{let a=r(t);["src","data-src","data-original","data-lazy","data-url","href","data-full","data-image","data-lazy-src","data-hi-res-src","data-high-res"].forEach(e=>{let t=a.attr(e);t&&i(t)});let s=a.attr("srcset");s&&s.split(",").forEach(e=>{let t=e.trim().split(" ")[0];t&&i(t)});let n=a.attr("style");if(n){let e=n.match(/url\(['"]?([^'"()]+)['"]?\)/g);e?.forEach(e=>{i(e.replace(/url\(['"]?([^'"()]+)['"]?\)/,"$1"))})}})}),a}async function*x(e){let t={visitedUrls:new Set,pendingUrls:[e],imageUrls:new Set,baseUrl:e,domain:new URL(e).hostname,isDomainCrawl:!0},r=E(U.CONCURRENT_REQUESTS),a=[];try{for(;t.pendingUrls.length>0&&t.imageUrls.size<U.MAX_IMAGES&&t.visitedUrls.size<U.MAX_PAGES_TO_CRAWL;){let i=t.pendingUrls.shift();if(!t.visitedUrls.has(i)){t.visitedUrls.add(i);try{let s=await R(i),n=await T(s,i);for(let e of Array.from(n))!t.imageUrls.has(e)&&t.imageUrls.size<U.MAX_IMAGES&&(t.imageUrls.add(e),a.push(e),a.length>=U.STREAM_CHUNK_SIZE&&(yield{newImages:a.map(e=>({url:e,filename:`image_${g().randomBytes(4).toString("hex")}.jpg`,status:"pending",type:h.lookup(e)||"image/*"})),crawlStatus:{pagesScanned:t.visitedUrls.size,pagesRemaining:t.pendingUrls.length,totalImages:t.imageUrls.size,maxImagesReached:t.imageUrls.size>=U.MAX_IMAGES}},a=[]));let o=c.load(s),l=o("a[href]").map((e,t)=>o(t).attr("href")).get();await Promise.all(l.map(a=>r(async()=>{try{if(!a)return;let r=new URL(a,i).toString();!function(e,t){try{let r=new URL(e).hostname,a=new URL(t).hostname;return r===a}catch{return!1}}(r,e)||t.visitedUrls.has(r)||t.pendingUrls.includes(r)||t.pendingUrls.push(r)}catch(e){}})))}catch(e){console.warn(`Failed to process ${i}:`,e);continue}await new Promise(e=>setTimeout(e,100))}}a.length>0&&(yield{newImages:a.map(e=>({url:e,filename:`image_${g().randomBytes(4).toString("hex")}.jpg`,status:"pending",type:h.lookup(e)||"image/*"})),crawlStatus:{pagesScanned:t.visitedUrls.size,pagesRemaining:t.pendingUrls.length,totalImages:t.imageUrls.size,maxImagesReached:t.imageUrls.size>=U.MAX_IMAGES}})}catch(e){throw console.error("Stream error:",e),e}}async function v(e){let t=new TextEncoder,r=!1;try{let{url:a}=await e.json();if(!a)return o.Z.json({error:"URL is required"},{status:400});let i=new TransformStream({async transform(e,a){r||a.enqueue(t.encode(`data: ${JSON.stringify(e)}

`))},flush(){r=!0}}),s=i.writable.getWriter();return e.signal.addEventListener("abort",()=>{r=!0,s.close().catch(()=>{})}),(async()=>{try{for await(let e of x(a)){if(r)break;await s.write(e)}}catch(e){if(console.error("Stream error:",e),!r)try{await s.write({error:"Crawling failed",message:e.message})}catch(e){}}finally{try{await s.close()}catch(e){}}})(),new o.Z(i.readable,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive"}})}catch(e){return console.error("Error in POST handler:",e),o.Z.json({error:"Failed to fetch images"},{status:500})}}async function b(e){try{let{urls:t}=await e.json(),r=E(U.CONCURRENT_REQUESTS),a=new(p()),i=a.folder("images");if(!i)throw Error("Failed to create images folder");let s=t.map(e=>r(async()=>{try{let t=await A(e),r=t.headers["content-type"],a=(function(e,t){let r=new URL(e).pathname.split("/").pop()||"image";if(r=r.split("?")[0],!(r=f()(r)).includes(".")){let e=h.extension(t);e&&(r+=`.${e}`)}let a=g().createHash("md5").update(e).digest("hex").slice(0,8),i=r.replace(/\.[^/.]+$/,""),s=r.slice(r.lastIndexOf("."));return`${i}-${a}${s}`})(e,r).replace(/[^a-zA-Z0-9._-]/g,"_");return i.file(a,t.data,{binary:!0,createFolders:!0,date:new Date}),{url:e,filename:a,size:t.data.length,type:r,status:"complete"}}catch(t){return console.error(`Failed to download: ${e}`,t),{url:e,status:"error"}}}));await Promise.all(s);let n=await a.generateAsync({type:"arraybuffer",compression:"DEFLATE",compressionOptions:{level:6},platform:"UNIX"});return new o.Z(n,{headers:{"Content-Type":"application/zip","Content-Disposition":"attachment; filename=downloaded_images.zip"}})}catch(e){return console.error(e),o.Z.json({error:"Failed to download images"},{status:500})}}let _=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/images/route",pathname:"/api/images",filename:"route",bundlePath:"app/api/images/route"},resolvedPagePath:"D:\\Bhavesh\\webdl\\src\\app\\api\\images\\route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:I,staticGenerationAsyncStorage:z,serverHooks:C,headerHooks:q,staticGenerationBailout:M}=_,L="/api/images/route";function N(){return(0,n.patchFetch)({serverHooks:C,staticGenerationAsyncStorage:z})}},4033:(e,t,r)=>{"use strict";var a=r(138),i=/[\/\?<>\\:\*\|"]/g,s=/[\x00-\x1f\x80-\x9f]/g,n=/^\.+$/,o=/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i,l=/[\. ]+$/;function c(e,t){if("string"!=typeof e)throw Error("Input must be string");return a(e.replace(i,t).replace(s,t).replace(n,t).replace(o,t).replace(l,t),255)}e.exports=function(e,t){var r=t&&t.replacement||"",a=c(e,r);return""===r?a:c(a,"")}},138:(e,t,r)=>{"use strict";var a=r(8140),i=Buffer.byteLength.bind(Buffer);e.exports=a.bind(null,i)},8140:e=>{"use strict";e.exports=function(e,t,r){if("string"!=typeof t)throw Error("Input must be string");for(var a,i,s,n=t.length,o=0,l=0;l<n;l+=1){if(i=t.charCodeAt(l),s=t[l],i>=55296&&i<=56319&&(a=t.charCodeAt(l+1))>=56320&&a<=57343&&(l+=1,s+=t[l]),(o+=e(s))===r)return t.slice(0,l+1);if(o>r)return t.slice(0,l-s.length+1)}return t}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[867,230],()=>r(7128));module.exports=a})();