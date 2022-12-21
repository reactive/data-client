(self.webpackChunk=self.webpackChunk||[]).push([[80387],{69762:(e,t,r)=>{"use strict";const n=(0,r(67294).createContext)({selectedValue:"",setSelectedValue:e=>{throw new Error("No Tab provider")},values:[]});t.Z=n},90008:(e,t,r)=>{"use strict";r.d(t,{Z:()=>U});var n=r(67294),a=r(87462),o=r(99401),s=r(11614),l=r(6832),i=r(86010),c=r(49544),u=r(69762),d=r(45045),p=r(13743),m=r(45440);function g(e){let{fixtures:t}=e;return n.createElement("div",{className:m.Z.fixtureBlock},t.map((e=>n.createElement("div",{key:e.endpoint.key(...e.args),className:m.Z.fixtureItem},n.createElement("div",{className:m.Z.fixtureHeader},e.endpoint.key(...e.args)),n.createElement(f,{fixture:e})))))}var h=(0,n.memo)(g);function f(e){let{fixture:t}=e;return"function"==typeof t.response?"function":n.createElement(p.Z,{language:"json",className:m.Z.fixtureJson},JSON.stringify(t.response))}var y=r(62974);function k(){return n.createElement(n.Fragment,null,n.createElement("script",{dangerouslySetInnerHTML:{__html:v},type:"application/javascript"}))}var b=(0,n.memo)(k);const v=`\nif (!/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(\n  navigator.userAgent,\n) && !window.monacoPreloaded) {\n[${["https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.nls.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/basic-languages/typescript/typescript.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsMode.js"].map((e=>`'${e}'`)).join(",")}].forEach(href => {\nwindow.monacoPreloaded = true;\nvar link = document.createElement("link");\nlink.href = href;\nlink.rel = "preload";\nlink.as = href.endsWith('.js') ? 'script' : 'style';\ndocument.head.appendChild(link);\n});\n[${["https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/base/worker/workerMain.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsWorker.js"].map((e=>`'${e}'`)).join(",")}].forEach(href => {\nwindow.monacoPreloaded = true;\nvar link = document.createElement("link");\nlink.href = href;\nlink.rel = "prefetch";\nlink.as = 'script';\ndocument.head.appendChild(link);\n});\n}\n`;var w=r(76226),E=r(30573);let x;if("undefined"!=typeof window&&!/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)){const e=["rest","core","react","endpoint","normalizr","graphql","hooks"],t=["react","rest-hooks","@rest-hooks/rest","@rest-hooks/react","@rest-hooks/graphql","@rest-hooks/hooks","bignumber.js"];if(!x){const n=E.Z.init();n.then((e=>{e&&(x=e,e.languages.typescript.typescriptDefaults.setCompilerOptions({allowNonTsExtensions:!0,target:e.languages.typescript.ScriptTarget.ES2017,jsx:e.languages.typescript.JsxEmit.React,strict:!0,strictNullChecks:!0,exactOptionalPropertyTypes:!0,lib:["dom","esnext"],module:e.languages.typescript.ModuleKind.ESNext,moduleResolution:e.languages.typescript.ModuleResolutionKind.NodeJs,typeRoots:["node_modules/@types"],allowSyntheticDefaultImports:!0,skipLibCheck:!0,noImplicitAny:!1}),e.editor.defineTheme("prism",{base:"vs-dark",inherit:!0,rules:[{token:"number",foreground:"f78c6c"},{token:"string",foreground:"b6d986"},{token:"keyword",fontStyle:"italic",foreground:"7da4f6"},{token:"type",foreground:"ffcb6b"},{token:"delimiter",foreground:"C792EA"},{token:"tag",foreground:"FF5590"}],colors:{"editor.foreground":"#bfc7d5","editor.inactiveSelectionBackground":"#484d5b"}}),e.languages.registerCompletionItemProvider("typescript",{triggerCharacters:["'",'"',".","/"],provideCompletionItems:(r,n)=>{const a=r.getValueInRange({startLineNumber:1,startColumn:1,endLineNumber:n.lineNumber,endColumn:n.column});if(/(([\s|\n]+from\s+)|(\brequire\b\s*\())["|'][^'^"]*$/.test(a)){if(a.endsWith(".")||a.endsWith("/")){const t=e.editor.getModels().map((e=>e.uri.path)).map((t=>{const r=/\/\d+\//g.exec(t)?.[0]??"",n=t.substring(r.length-1);return{label:n,insertText:n.replace(/\.tsx?$/,""),kind:e.languages.CompletionItemKind.Module}}));if(!t.length)return;return{suggestions:t}}return{suggestions:t.map((t=>({label:t,kind:e.languages.CompletionItemKind.Module,insertText:t})))}}}}))})),Promise.allSettled([n,r.e(37956).then(r.t.bind(r,70637,23)),r.e(49033).then(r.t.bind(r,7712,23)),r.e(42713).then(r.t.bind(r,93716,23)),r.e(78789).then(r.t.bind(r,52031,23)),...e.map((e=>r(73795)(`./${e}.d.ts`)))]).then((t=>{let[r,...n]=t;if("fulfilled"!==r.status||!r.value)return;const a=r.value,[o,s,l,i,...c]=n.map((e=>"fulfilled"===e.status?e.value.default:""));return a.languages.typescript.typescriptDefaults.addExtraLib("declare module \"react/jsx-runtime\" {\n        import './';\n      }","file:///node_modules/@types/react/jsx-runtime.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib("import * as React from 'react'\n\n    declare global {\n      namespace JSX {\n        interface IntrinsicElements {\n          strike: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;\n        }\n      }\n    }","file:///node_modules/@types/react/more.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib("declare function render(component:JSX.Element):void;\n        declare function CurrentTime(props: {}):JSX.Element;\n        declare function ResetableErrorBoundary(props: { children: JSX.ReactChild }):JSX.Element;\n        declare function randomFloatInRange(min: number, max: number, decimals?: number): number;"),a.languages.typescript.typescriptDefaults.addExtraLib(o,"es2022"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "react" { ${s} }`,"file:///node_modules/@types/react/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "bignumber.js" { ${l} }`,"file:///node_modules/bignumber.js/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "rest-hooks" { ${i} }`,"file:///node_modules/rest-hooks/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare globals { ${s} }`),c.forEach(((t,r)=>{const n=e[r];a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "@rest-hooks/${n}" { ${t} }`,`file:///node_modules/@rest-hooks/${t}/index.d.ts`),["rest","react"].includes(n)&&a.languages.typescript.typescriptDefaults.addExtraLib(`declare globals { ${t} }`)})),a.languages.typescript.typescriptDefaults.setEagerModelSync(!0),a}))}}const S=(0,n.memo)(w.ZP);const N={scrollbar:{alwaysConsumeMouseWheel:!1},minimap:{enabled:!1},wordWrap:"on",scrollBeyondLastLine:!1,wrappingIndent:"indent",lineNumbers:"off",folding:!1,fontLigatures:!0,fontFamily:'"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',fontSize:"13px",lineHeight:19};const C=(0,n.memo)(c.uz);var Z=r(3495).Z?function(e){let{onChange:t,code:r,path:a,autoFocus:o=!1,...s}=e;a.endsWith(".tsx")||a.endsWith(".ts")||(a+=".tsx"),function(e,t){const r=function(e){const t=(0,w.Ik)(),r=(0,n.useRef)();return(0,n.useEffect)((()=>{t&&t.languages.typescript.getTypeScriptWorker().then((e=>e())).then((e=>{r.current=e}))}),[t]),r}();(0,n.useCallback)((function(){r.current&&e(r.current)}),t)}((e=>{e.getEmitOutput(`file:///${a}`).then((e=>{t(e.outputFiles[0].text)}))}),[t,a]);const[l,i]=(0,n.useState)("100%"),u=(0,n.useCallback)((e=>{o&&e.focus();const t=Object.keys(s).map((e=>/\{(\d+)\}/.exec(e)?.[1])).filter(Boolean);t.length&&e.setSelections(t.map((e=>{const t=Number.parseInt(e,10);return{selectionStartLineNumber:t,selectionStartColumn:0,positionLineNumber:t+1,positionColumn:0}})));const r=e.getDomNode(),n=r.getElementsByClassName("view-lines")[0];let a=0;const l=19*e.getModel().getLineCount()+10;r.style.height=l+"px",i(l),e.layout(),e.onDidChangeModelDecorations((()=>{setTimeout((()=>{const t=19*n.childElementCount+10;a=n.childElementCount,r.style.height=t+"px",i(l),e.layout()}),0)}))}),[]);return n.createElement(S,{path:a,defaultLanguage:"typescript",onChange:t,defaultValue:r,options:N,theme:"prism",onMount:u,height:l,loading:n.createElement(c.uz,{language:"tsx",code:r,disabled:!0})})}:function(e){let{onChange:t,code:r}=e;return n.createElement(C,{onChange:t,code:r})},R=r(80086);function P(){const{selectedValue:e,setSelectedValue:t,values:r}=(0,n.useContext)(u.Z);return n.createElement("div",{className:m.Z.tabs,role:"tablist","aria-orientation":"horizontal"},r.map((r=>{let{value:a,label:o}=r;return n.createElement("div",{role:"tab",tabIndex:e===a?0:-1,"aria-selected":e===a,key:a,className:(0,i.Z)(m.Z.tab,{[m.Z.selected]:e===a}),onFocus:t,onClick:t,value:a},o)})))}function j(e){let{children:t}=e;return n.createElement(y.Z,{className:m.Z.tabControls},n.createElement("div",{className:m.Z.title},t),n.createElement(P,null))}function O(e){let{title:t,fixtures:r}=e;const{values:a}=(0,n.useContext)(u.Z),o=a.length>0;return n.createElement(n.Fragment,null,r.length?n.createElement(n.Fragment,null,n.createElement(y.Z,{className:m.Z.small},"Fixtures"),n.createElement(h,{fixtures:r})):null,o?n.createElement(j,null,t):null)}function T(e){let{children:t,transformCode:r,groupId:s,defaultOpen:u,row:d,hidden:p,fixtures:g,includeEndpoints:h,...f}=e;const{liveCodeBlock:{playgroundPosition:y}}=(0,l.Z)().siteConfig.themeConfig,k=(0,o.p)();return n.createElement(n.Fragment,null,n.createElement("div",{className:(0,i.Z)(m.Z.playgroundContainer,{[m.Z.row]:d,[m.Z.hidden]:p})},n.createElement(c.nu,(0,a.Z)({theme:k},f),n.createElement(M,{reverse:"top"===y,row:d,fixtures:g,includeEndpoints:h,groupId:s,defaultOpen:u},t))),n.createElement(b,null))}function M(e){let{reverse:t,children:r,row:o,fixtures:s,includeEndpoints:l,groupId:u,defaultOpen:p}=e;const g=(0,n.useMemo)((()=>(1e4*Math.random()).toPrecision(4).toString()),[]),h=(0,n.useMemo)((()=>"string"==typeof r?[{code:r.replace(/\n$/,""),collapsed:!1}]:(Array.isArray(r)?r:[r]).filter((e=>e.props.children)).map((e=>"string"==typeof e.props.children?e.props:e.props.children.props)).map((e=>{let{children:t,title:r="",collapsed:n=!1,path:a,...o}=e;return{code:t.replace(/\n$/,""),title:r.replaceAll('"',""),collapsed:n,path:a,...o}}))),[r]),[f,y]=(0,n.useReducer)(A,void 0,(()=>h.map((e=>{let{code:t}=e;return t})))),k=(0,n.useMemo)((()=>h.map(((e,t)=>e=>{y({i:t,code:e})}))),[h.length]),[b,v]=(0,n.useState)((()=>h.map((e=>{let{collapsed:t}=e;return t})))),w=f.join("\n");return n.createElement(I,{reverse:t},n.createElement("div",null,n.createElement(O,{fixtures:!o&&s}),o&&h.length>1?n.createElement(F,{titles:h.map((e=>{let{title:t}=e;return t})),closedList:b,onClick:e=>v((t=>t.map(((t,r)=>r!==e))))}):null,h.map(((e,t)=>{let{title:r,path:s,code:l,collapsed:c,...u}=e;return n.createElement(n.Fragment,{key:t},!o&&r?n.createElement(D,{onClick:()=>v((e=>{const r=[...e];return r[t]=!r[t],r})),closed:b[t],title:r}):null,n.createElement("div",{key:t,className:(0,i.Z)(m.Z.playgroundEditor,{[m.Z.hidden]:b[t]})},n.createElement(Z,(0,a.Z)({key:t,onChange:k[t],code:f[t],path:"/"+g+"/"+(s||r||"default.tsx")},u))))}))),n.createElement(d.Z,{fallback:n.createElement(c.nu,{key:"preview",code:'render(() => "Loading...");',noInline:!0},n.createElement(R.Z,{key:"preview",includeEndpoints:l,groupId:u,defaultOpen:p,row:o,fixtures:s}))},n.createElement(_,{code:w,includeEndpoints:l,groupId:u,defaultOpen:p,row:o,fixtures:s})))}O.defaultProps={title:n.createElement(s.Z,{id:"theme.Playground.liveEditor",description:"The live editor label of the live codeblocks"},"Editor"),fixtures:[]},T.defaultProps={row:!1,hidden:!1};const L="object"==typeof navigator&&/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator?.userAgent),_=(0,n.lazy)((()=>L?Promise.resolve({default:e=>null}):Promise.all([r.e(86429),r.e(87876),r.e(73287),r.e(26750)]).then(r.bind(r,41380))));function I(e){let{children:t,reverse:r}=e;const n=[...t];return n.reverse(),r?n:t}function A(e,t){const r=[...e];return r[t.i]=t.code,r}function D(e){let{onClick:t,closed:r,title:a}=e;return n.createElement(y.Z,{className:m.Z.small,onClick:t},n.createElement("span",{className:(0,i.Z)(m.Z.arrow,r?m.Z.right:m.Z.down)},"\u25b6"),a)}function F(e){let{titles:t,closedList:r,onClick:a}=e;const{values:o}=(0,n.useContext)(u.Z),s=o.length>0;return n.createElement(y.Z,{className:(0,i.Z)({[m.Z.small]:s,[m.Z.subtabs]:s},m.Z.noupper,m.Z.tabControls)},n.createElement("div",{className:m.Z.tabs,role:"tablist","aria-orientation":"horizontal"},t.map(((e,t)=>n.createElement("div",{role:"tab",key:t,onClick:()=>a(t),className:(0,i.Z)(m.Z.tab,{[m.Z.selected]:!r[t]})},e)))))}I.defaultProps={reverse:!1};const H=e=>{let{children:t,groupId:r,hidden:a=!1,defaultOpen:o,row:s=!1,fixtures:l}=e;return n.createElement(T,{includeEndpoints:!Array.isArray(t),noInline:!0,groupId:r,defaultOpen:o,row:s,hidden:a,fixtures:l},"string"==typeof t||Array.isArray(t)?t:t.props.children)};H.defaultProps={defaultOpen:"n",fixtures:[]};var U=(0,n.memo)(H)},45045:(e,t,r)=>{"use strict";r.d(t,{Z:()=>o});var n=r(19666),a=r(67294);function o(e){let{fallback:t,children:r}=e;return a.createElement(n.Z,{fallback:t},(()=>a.createElement(a.Suspense,{fallback:t},r)))}},62974:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});var n=r(67294),a=r(86010),o=r(45440);function s(e){let{children:t,className:r,onClick:s}=e;return n.createElement("div",{className:(0,a.Z)(o.Z.playgroundHeader,r,s?o.Z.clickable:null),onClick:s},t)}},80086:(e,t,r)=>{"use strict";r.d(t,{Z:()=>T});var n=r(67294),a=r(11614),o=r(92785),s=r(92954),l=r(48256),i=r(3604),c=r(39714),u=r(86010),d=r(76602),p=r(63735),m=r(45440),g=r(29451),h=r(50634),f=r(70524);function y(e){let{value:t}=e;const r="dark"===(0,f.I)().colorMode,a=(0,n.useMemo)((()=>({String:"rgb(195, 232, 141)",Date:"rgb(247, 140, 108)",Number:"rgb(247, 140, 108)",Boolean:"rgb(247, 140, 108)",Null:"rgb(255, 88, 116)",Undefined:"rgb(255, 88, 116)",Function:"rgb(247, 140, 108)",Symbol:"rgb(247, 140, 108)"})),[]),o=(0,n.useMemo)((()=>({tree:{overflow:"auto",flex:"4 1 70%",margin:0,padding:"0 0.5rem 0 0.8rem",backgroundColor:r?"var(--ifm-pre-background)":"rgb(41, 45, 62)",font:"var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace) !important",color:"rgb(227, 227, 227)"},arrowContainer:(e,t)=>{let{style:r}=e;return{style:{...r,fontFamily:"arial",padding:"7px 7px 7px 0",margin:"-7px calc(0.5em - 7px) -7px 0"}}},arrowSign:{color:"rgb(130, 170, 255)"},label:{color:"rgb(130, 170, 255)"},itemRange:{color:"rgb(105, 112, 152)"},valueText:(e,t)=>{let{style:r}=e;return{style:{...r,color:a[t]}}},base0B:"rgb(191, 199, 213)"})),[r,a]);return n.createElement(h.L,{shouldExpandNode:k,data:t,valueRenderer:v,theme:o,hideRoot:!0})}function k(e,t,r){return 0===r||(!(1!==r||!["entities","results"].includes(e[0]))||(2===r&&"entities"===e[1]||(2===r&&"results"===e[1]||(3===r&&"entities"===e[2]||3===r&&"results"===e[2]))))}const b="undefined"!=typeof Intl;function v(e,t){const r=arguments.length<=2?void 0:arguments[2];return b&&"number"==typeof t&&"string"==typeof r&&isFinite(t)&&("date"===r||r.endsWith("At"))?Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:3}).format(t):e}function w(e){let{toggle:t,selectedValue:r}=e;const a="y"===r,o=a?m.Z.right:m.Z.left;return n.createElement(n.Fragment,null,n.createElement("div",{className:m.Z.debugToggle,onClick:t},"Store",n.createElement("span",{className:(0,u.Z)(m.Z.arrow,o,m.Z.vertical)},"\u25b6")),a?n.createElement(S,null):null)}var E=(0,n.memo)(w);function x(){const e=(0,n.useContext)(g.sA),t=(0,n.useMemo)((()=>{const t={...e};return delete t.optimistic,t}),[e]);return n.createElement(y,{value:t})}const S=(0,n.memo)(x);var N=r(45045);function C(e){let{groupId:t,defaultOpen:r,row:a,fixtures:g}=e;const{tabGroupChoices:h,setTabGroupChoices:f}=(0,d.U)(),[y,k]=(0,n.useState)(r),{blockElementScrollPositionUntilNextRender:b}=(0,p.o5)();if(null!=t){const e=h[t];null!=e&&e!==y&&k(e)}const v=(0,n.useCallback)((e=>{b(e.currentTarget),k((e=>"y"===e?"n":"y")),f(t,"y"===y?"n":"y")}),[b,t,y,f]),w=(0,n.useMemo)((()=>[new o.Z,new s.Z(l.Z)]),[]),x=!("n"===y||!a);return n.createElement(i.Z,{managers:w},n.createElement(c.Z,{fixtures:g,silenceMissing:!0},n.createElement("div",{className:(0,u.Z)(m.Z.playgroundPreview,{[m.Z.hidden]:x})},n.createElement(N.Z,{fallback:n.createElement(R,null)},n.createElement(P,null))),n.createElement(E,{selectedValue:y,toggle:v})))}var Z=(0,n.memo)(C);function R(){return n.createElement("div",null,"Loading...")}const P=(0,n.lazy)((()=>Promise.all([r.e(86429),r.e(87876),r.e(73287),r.e(26750)]).then(r.bind(r,15929))));var j=r(62974);function O(e){let{groupId:t,defaultOpen:r,row:o,fixtures:s}=e;return n.createElement("div",{style:{overflow:"hidden",display:"flex",flexDirection:"column"}},n.createElement(j.Z,null,n.createElement(a.Z,{id:"theme.Playground.result",description:"The result label of the live codeblocks"},"Live Preview")),n.createElement("div",{className:m.Z.playgroundResult},n.createElement(Z,{groupId:t,defaultOpen:r,row:o,fixtures:s})))}var T=(0,n.memo)(O)},3495:(e,t)=>{"use strict";const r="undefined"!=typeof window&&!/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(navigator.userAgent);t.Z=r},57489:(e,t,r)=>{"use strict";var n=r(67294),a=r(64820);const o={React:n,...n,...a};t.Z=o},85219:(e,t,r)=>{"use strict";r.r(t),r.d(t,{assets:()=>u,contentTitle:()=>i,default:()=>m,frontMatter:()=>l,metadata:()=>c,toc:()=>d});var n=r(87462),a=(r(67294),r(3905)),o=r(90008),s=r(86429);const l={title:"Query, getState() and partial hydration SSR improvements",authors:["ntucker"],tags:["releases","rest-hooks","packages","rest","resource","endpoint"]},i=void 0,c={permalink:"/blog/2022/11/09/Query-getState-SSR-partial-hydration",source:"@site/blog/2022-11-09-Query-getState-SSR-partial-hydration.md",title:"Query, getState() and partial hydration SSR improvements",description:"We recently release two new package versions Rest Hooks@6.5 and @rest-hooks/rest@6.1. These",date:"2022-11-09T00:00:00.000Z",formattedDate:"November 9, 2022",tags:[{label:"releases",permalink:"/blog/tags/releases"},{label:"rest-hooks",permalink:"/blog/tags/rest-hooks"},{label:"packages",permalink:"/blog/tags/packages"},{label:"rest",permalink:"/blog/tags/rest"},{label:"resource",permalink:"/blog/tags/resource"},{label:"endpoint",permalink:"/blog/tags/endpoint"}],readingTime:3.32,hasTruncateMarker:!0,authors:[{name:"Nathaniel Tucker",title:"Creator of Rest Hooks",url:"https://github.com/ntucker",imageURL:"https://github.com/ntucker.png",key:"ntucker"}],frontMatter:{title:"Query, getState() and partial hydration SSR improvements",authors:["ntucker"],tags:["releases","rest-hooks","packages","rest","resource","endpoint"]},prevItem:{title:"v7 - React Native, Web and SSR upgrades and more",permalink:"/blog/2022/12/19/rest-hooks-7-react-native-web-nextjs"},nextItem:{title:"Lifecycle controlflow diagrams using Mermaid",permalink:"/blog/2022/11/07/Lifecycle-controlflow-diagrams-mermaid"}},u={authorsImageUrls:[void 0]},d=[{value:"Rest Hooks 6.5",id:"rest-hooks-65",level:3},{value:"@rest-hooks/rest 6.1",id:"rest-hooksrest-61",level:3},{value:"New Features",id:"new-features",level:2},{value:"Partial Hydration SSR",id:"partial-hydration-ssr",level:3},{value:"What&#39;s next",id:"whats-next",level:4},{value:"Controller.getState()",id:"controllergetstate",level:3},{value:"Query",id:"query",level:3},{value:"schema.All",id:"schemaall",level:3},{value:"What&#39;s next",id:"whats-next-1",level:4}],p={toc:d};function m(e){let{components:t,...r}=e;return(0,a.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"We recently release two new package versions ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/coinbase/rest-hooks/releases/tag/rest-hooks%406.5.0"},"Rest Hooks@6.5")," and ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/coinbase/rest-hooks/releases/tag/%40rest-hooks%2Frest%406.1.0"},"@rest-hooks/rest@6.1"),". These\ninclude some solutions to long-standing user-requested functionality. Additionally, we'll give a preview of even more\nfeatures soon to come."),(0,a.kt)("h3",{id:"rest-hooks-65"},"Rest Hooks 6.5"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"Better ",(0,a.kt)("a",{parentName:"li",href:"/blog/2022/11/09/Query-getState-SSR-partial-hydration#partial-hydration-ssr"},"partial hydration SSR support")," and compatibility with NextJS SSR"),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"/blog/2022/11/09/Query-getState-SSR-partial-hydration#controllergetstate"},"Controller.getState()")," provides access to\nstate inside event handlers")),(0,a.kt)("h3",{id:"rest-hooksrest-61"},"@rest-hooks/rest 6.1"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"/blog/2022/11/09/Query-getState-SSR-partial-hydration#query"},"Query")," provides programmatic access to the Rest Hooks store."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"/blog/2022/11/09/Query-getState-SSR-partial-hydration#schemaall"},"schema.All()")," retrieves all entities in the store. Very useful with ",(0,a.kt)("a",{parentName:"li",href:"/blog/2022/11/09/Query-getState-SSR-partial-hydration#query"},"Query"))),(0,a.kt)("h2",{id:"new-features"},"New Features"),(0,a.kt)("h3",{id:"partial-hydration-ssr"},"Partial Hydration SSR"),(0,a.kt)("p",null,"Client-side React concurrent features like startTransition only work with Context. However, server-side,\nReact will only re-render Suspended elements. This means any context provides must suspend the context themselves,\nwhich would mean the suspense boundaries would have to be around the entire application."),(0,a.kt)("p",null,"With this update, we use ",(0,a.kt)("a",{parentName:"p",href:"https://reactjs.org/docs/hooks-reference.html#usesyncexternalstore"},"useSyncExternalStore")," if\nwhen running SSR. This is not ideal to replace client render because it eliminates startTransition benefits client-side."),(0,a.kt)("p",null,"In addition, the ",(0,a.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/@rest-hooks/ssr"},"SSR helpers")," were updated to better\nhandle these use cases. You can use the ",(0,a.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/@rest-hooks/ssr"},"@rest-hooks/ssr readme")," for\ninstructions on usage with vanilla React 18."),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/coinbase/rest-hooks/pull/2253"},"PR")),(0,a.kt)("h4",{id:"whats-next"},"What's next"),(0,a.kt)("p",null,"Currently there is no documentation on SSR on this docs site, even though we have one ",(0,a.kt)("a",{parentName:"p",href:"https://stackblitz.com/github/ntucker/anansi/tree/master/examples/concurrent"},"working demo")," and ",(0,a.kt)("a",{parentName:"p",href:"https://www.npmjs.com/package/@rest-hooks/ssr"},"@rest-hooks/ssr readme")," for vanilla React 18. We will soon be adding guides to this site for React 18, as well as frameworks like NextJS."),(0,a.kt)("h3",{id:"controllergetstate"},"Controller.getState()"),(0,a.kt)("p",null,"Oftentimes control flow in an event handler after a mutation relies on the data from that mutation. For instance,\nperforming a url redirect to a newly created member. When taking advantage of the Rest Hooks data model for things like\n",(0,a.kt)("a",{parentName:"p",href:"/rest/guides/computed-properties"},"computed properties")," this can mean having the raw fetch response is not enough."),(0,a.kt)("p",null,"With ",(0,a.kt)("a",{parentName:"p",href:"/docs/api/Controller#getState"},"Controller.getState()")," you can access the same (with referential equality guarantees!)\ndata you would get from a data-binding hook like ",(0,a.kt)("a",{parentName:"p",href:"/docs/api/useSuspense"},"useSuspense")," or ",(0,a.kt)("a",{parentName:"p",href:"/docs/api/useCache"},"useCache"),"."),(0,a.kt)("p",null,"Be careful though as this can lead to race conditions if used outside of an event handler. For this\nreason we kept its usage explicit so you can always see where the data is coming from."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},"const controller = useController();\n\nconst updateHandler = useCallback(\n  async updatePayload => {\n    await controller.fetch(\n      MyResource.update,\n      { id },\n      updatePayload,\n    );\n    const denormalized = controller.getResponse(\n      MyResource.update,\n      { id },\n      updatePayload,\n      controller.getState(),\n    );\n    redirect(denormalized.getterUrl);\n  },\n  [id],\n);\n")),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/coinbase/rest-hooks/pull/2252"},"PR")),(0,a.kt)("h3",{id:"query"},"Query"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/rest/api/Query"},"Query")," provides programmatic access to the Rest Hooks store. This improves post-processing\nuse cases, by providing a mechanism to take advtange of the global memoization for improved performance as well as\neasy code-sharing of Endpoint interfaces."),(0,a.kt)(o.Z,{fixtures:[{endpoint:new s.Z({path:"/users"}),args:[],response:[{id:"123",name:"Jim"},{id:"456",name:"Jane"},{id:"777",name:"Albatras",isAdmin:!0}],delay:150}],mdxType:"HooksPlayground"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="api/User.ts" collapsed',title:'"api/User.ts"',collapsed:!0},"export class User extends Entity {\n  id = '';\n  name = '';\n  isAdmin = false;\n  pk() {\n    return this.id;\n  }\n}\nexport const UserResource = createResource({\n  path: '/users/:id',\n  schema: User,\n});\n")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx",metastring:'title="UsersPage.tsx" {15}',title:'"UsersPage.tsx"',"{15}":!0},"import { Query, schema } from '@rest-hooks/rest';\nimport { UserResource, User } from './api/User';\n\nconst sortedUsers = new Query(\n  new schema.All(User),\n  (entries, { asc } = { asc: false }) => {\n    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));\n    if (asc) return sorted;\n    return sorted.reverse();\n  }\n);\n\nfunction UsersPage() {\n  useFetch(UserResource.getList);\n  const users = useCache(sortedUsers, { asc: true });\n  if (!users) return <div>No users in cache yet</div>;\n  return (\n    <div>\n      {users.map(user => (\n        <div key={user.pk()}>{user.name}</div>\n      ))}\n    </div>\n  );\n}\nrender(<UsersPage />);\n"))),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://github.com/coinbase/rest-hooks/pull/2229"},"PR")),(0,a.kt)("h3",{id:"schemaall"},"schema.All"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"/rest/api/All"},"schema.All")," retrieves all entities in cache as an Array. This provides a new way\nof accessing the Rest Hooks store, and when combined with ",(0,a.kt)("a",{parentName:"p",href:"/rest/api/Query"},"Query")," can be very powerful."),(0,a.kt)("h4",{id:"whats-next-1"},"What's next"),(0,a.kt)("p",null,"Inspired by ",(0,a.kt)("a",{parentName:"p",href:"https://backbonejs.org/#Collection"},"BackboneJS"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"Collections")," are a new schema\nplanned to better handle many-to-one and many-to-many relationships alongside ",(0,a.kt)("a",{parentName:"p",href:"/rest/api/createResource#create"},"creates"),".\nThey should eliminate the need for ",(0,a.kt)("a",{parentName:"p",href:"/rest/api/RestEndpoint#update"},"programmatic updates")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"controller.fetch(\n  MyResource.getList.create,\n  // same params as getList\n  { owner, repo },\n  // payload ('body')\n  FormObject\n);\n")))}m.isMDXComponent=!0},3905:(e,t,r)=>{"use strict";r.d(t,{Zo:()=>u,kt:()=>m});var n=r(67294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function s(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var i=n.createContext({}),c=function(e){var t=n.useContext(i),r=t;return e&&(r="function"==typeof e?e(t):s(s({},t),e)),r},u=function(e){var t=c(e.components);return n.createElement(i.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},p=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,i=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),p=c(r),m=a,g=p["".concat(i,".").concat(m)]||p[m]||d[m]||o;return r?n.createElement(g,s(s({ref:t},u),{},{components:r})):n.createElement(g,s({ref:t},u))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,s=new Array(o);s[0]=p;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l.mdxType="string"==typeof e?e:a,s[1]=l;for(var c=2;c<o;c++)s[c]=r[c];return n.createElement.apply(null,s)}return n.createElement.apply(null,r)}p.displayName="MDXCreateElement"},45440:(e,t)=>{"use strict";t.Z={playgroundContainer:"playgroundContainer_sLUA",playgroundHeader:"playgroundHeader_Zx4K",tabControls:"tabControls_trxh",row:"row_YGZs",hidden:"hidden_Hh8i",small:"small_xksL",clickable:"clickable_YHiX",noupper:"noupper_WDCF",subtabs:"subtabs_XtJb",playgroundEditor:"playgroundEditor_lYwu",closed:"closed_QJMa",arrow:"arrow_tivA",vertical:"vertical_OMeC",right:"right_vs_C",left:"left_iDcB",up:"up_H4F7",down:"down_oRky",playgroundPreview:"playgroundPreview_rk9R",playgroundError:"playgroundError_sRnA",playgroundResult:"playgroundResult_tefG",debugToggle:"debugToggle_zlro",title:"title_poUY",tabs:"tabs_m54V",tab:"tab_bTGw",selected:"selected_QXZk",fixtureBlock:"fixtureBlock_mpRK",fixtureItem:"fixtureItem_Jd6V",fixtureHeader:"fixtureHeader_KYel",fixtureJson:"fixtureJson_HnbR"}},73795:(e,t,r)=>{var n={"./core.d.ts":[90734,30007],"./endpoint.d.ts":[73118,72901],"./graphql.d.ts":[60467,99076],"./hooks.d.ts":[56890,22595],"./normalizr.d.ts":[14991,12192],"./react.d.ts":[61019,97359],"./rest.d.ts":[42714,46324]};function a(e){if(!r.o(n,e))return Promise.resolve().then((()=>{var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}));var t=n[e],a=t[0];return r.e(t[1]).then((()=>r.t(a,23)))}a.keys=()=>Object.keys(n),a.id=73795,e.exports=a}}]);