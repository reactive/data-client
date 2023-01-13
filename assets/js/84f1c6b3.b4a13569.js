(self.webpackChunk=self.webpackChunk||[]).push([[20197],{44128:(e,t,n)=>{"use strict";n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>p,frontMatter:()=>o,metadata:()=>s,toc:()=>u});var r=n(87462),a=(n(67294),n(3905)),l=(n(47885),n(28423));const o={title:"schema.Values"},i=void 0,s={unversionedId:"api/Values",id:"version-0.2/api/Values",title:"schema.Values",description:"schema.Values - Representing Objects with arbitrary keys | Rest Hooks",source:"@site/graphql_versioned_docs/version-0.2/api/Values.md",sourceDirName:"api",slug:"/api/Values",permalink:"/graphql/0.2/api/Values",draft:!1,editUrl:"https://github.com/coinbase/rest-hooks/edit/master/docs/graphql/api/Values.md",tags:[],version:"0.2",lastUpdatedBy:"Nathaniel Tucker",lastUpdatedAt:1664586789,formattedLastUpdatedAt:"Oct 1, 2022",frontMatter:{title:"schema.Values"},sidebar:"docs",previous:{title:"schema.Union",permalink:"/graphql/0.2/api/Union"},next:{title:"schema.Delete",permalink:"/graphql/0.2/api/Delete"}},c={},u=[{value:"Instance Methods",id:"instance-methods",level:2},{value:"Usage",id:"usage",level:2},{value:"Dynamic entity types",id:"dynamic-entity-types",level:3},{value:"string schemaAttribute",id:"string-schemaattribute",level:4},{value:"function schemaAttribute",id:"function-schemaattribute",level:4}],d={toc:u};function p(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("head",null,(0,a.kt)("title",null,"schema.Values - Representing Objects with arbitrary keys | Rest Hooks")),(0,a.kt)("p",null,"Like ",(0,a.kt)("a",{parentName:"p",href:"./Array"},"Array"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"Values")," are unbounded in size. The definition here describes the types of values to expect,\nwith keys being any string."),(0,a.kt)("p",null,"Describes a map whose values follow the given schema."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"definition"),": ",(0,a.kt)("strong",{parentName:"li"},"required")," A singular schema that this array contains ",(0,a.kt)("em",{parentName:"li"},"or")," a mapping of schema to attribute values."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"schemaAttribute"),": ",(0,a.kt)("em",{parentName:"li"},"optional")," (required if ",(0,a.kt)("inlineCode",{parentName:"li"},"definition")," is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.\nCan be a string or a function. If given a function, accepts the following arguments:",(0,a.kt)("ul",{parentName:"li"},(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"value"),": The input value of the entity."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"parent"),": The parent object of the input array."),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"key"),": The key at which the input array appears on the parent object.")))),(0,a.kt)("h2",{id:"instance-methods"},"Instance Methods"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("inlineCode",{parentName:"li"},"define(definition)"),": When used, the ",(0,a.kt)("inlineCode",{parentName:"li"},"definition")," passed in will be merged with the original definition passed to the ",(0,a.kt)("inlineCode",{parentName:"li"},"Values")," constructor. This method tends to be useful for creating circular references in schema.")),(0,a.kt)("h2",{id:"usage"},"Usage"),(0,a.kt)(l.Z,{groupId:"schema",defaultOpen:"y",mdxType:"HooksPlayground"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},"const sampleData = () =>\n  Promise.resolve({ firstThing: { id: 1 }, secondThing: { id: 2 } });\n\nclass Item extends Entity {\n  readonly id: number = 0;\n  pk() {\n    return `${this.id}`;\n  }\n}\nconst itemValues = new Endpoint(sampleData, {\n  schema: new schema.Values(Item),\n});\nfunction ItemPage() {\n  const items = useSuspense(itemValues, {});\n  return <pre>{JSON.stringify(items, undefined, 2)}</pre>;\n}\nrender(<ItemPage />);\n"))),(0,a.kt)("h3",{id:"dynamic-entity-types"},"Dynamic entity types"),(0,a.kt)("p",null,"If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like ",(0,a.kt)("inlineCode",{parentName:"p"},"schema.Union")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"schema.Array"),"."),(0,a.kt)("p",null,(0,a.kt)("em",{parentName:"p"},"Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created.")),(0,a.kt)("h4",{id:"string-schemaattribute"},"string schemaAttribute"),(0,a.kt)(l.Z,{groupId:"schema",defaultOpen:"y",mdxType:"HooksPlayground"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},"const sampleData = () =>\n  Promise.resolve({\n    firstLink: { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },\n    greatPost: { id: 10, type: 'post', content: 'good day!' },\n  });\n\nabstract class FeedItem extends Entity {\n  readonly id: number = 0;\n  declare readonly type: 'link' | 'post';\n  pk() {\n    return `${this.id}`;\n  }\n}\nclass Link extends FeedItem {\n  readonly type = 'link' as const;\n  readonly url: string = '';\n  readonly title: string = '';\n}\nclass Post extends FeedItem {\n  readonly type = 'post' as const;\n  readonly content: string = '';\n}\nconst feed = new Endpoint(sampleData, {\n  schema:\n    new schema.Values(\n      {\n        link: Link,\n        post: Post,\n      },\n      'type',\n    ),\n  ,\n});\nfunction FeedList() {\n  const feedItems = useSuspense(feed, {});\n  return (\n    <div>\n      {Object.entries(feedItems).map(([key, item]) =>\n        (<div key={item.pk()}>{key}: {item.type === 'link' ? (\n           <LinkItem link={item} />\n        ) : (\n          <PostItem post={item} />\n        )}</div>),\n      )}\n    </div>\n  );\n}\nfunction LinkItem({ link }: { link: Link }) {\n  return <a href={link.url}>{link.title}</a>;\n}\nfunction PostItem({ post }: { post: Post }) {\n  return <div>{post.content}</div>;\n}\nrender(<FeedList />);\n"))),(0,a.kt)("h4",{id:"function-schemaattribute"},"function schemaAttribute"),(0,a.kt)("p",null,"The return values should match a key in the ",(0,a.kt)("inlineCode",{parentName:"p"},"definition"),". Here we'll show the same behavior as the 'string'\ncase, except we'll append an 's'."),(0,a.kt)(l.Z,{groupId:"schema",defaultOpen:"y",mdxType:"HooksPlayground"},(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},"const sampleData = () =>\n  Promise.resolve({\n    firstLink: { id: 1, type: 'link', url: 'https://ntucker.true.io', title: 'Nate site' },\n    greatPost: { id: 10, type: 'post', content: 'good day!' },\n  });\n\nabstract class FeedItem extends Entity {\n  readonly id: number = 0;\n  declare readonly type: 'link' | 'post';\n  pk() {\n    return `${this.id}`;\n  }\n}\nclass Link extends FeedItem {\n  readonly type = 'link' as const;\n  readonly url: string = '';\n  readonly title: string = '';\n}\nclass Post extends FeedItem {\n  readonly type = 'post' as const;\n  readonly content: string = '';\n}\nconst feed = new Endpoint(sampleData, {\n  schema:\n    new schema.Values(\n      {\n        links: Link,\n        posts: Post,\n      },\n(input: any, parent: unknown, key: string) => `${input.type}s`,\n    ),\n  ,\n});\nfunction FeedList() {\n  const feedItems = useSuspense(feed, {});\n  return (\n    <div>\n      {Object.entries(feedItems).map(([key, item]) =>\n        (<div key={item.pk()}>{key}: {item.type === 'link' ? (\n           <LinkItem link={item} />\n        ) : (\n          <PostItem post={item} />\n        )}</div>),\n      )}\n    </div>\n  );\n}\nfunction LinkItem({ link }: { link: Link }) {\n  return <a href={link.url}>{link.title}</a>;\n}\nfunction PostItem({ post }: { post: Post }) {\n  return <div>{post.content}</div>;\n}\nrender(<FeedList />);\n"))))}p.isMDXComponent=!0},30433:(e,t,n)=>{"use strict";n.d(t,{Z:()=>o});var r=n(67294),a=n(86010),l="tabItem_Ymn6";function o(e){let{children:t,hidden:n,className:o}=e;return r.createElement("div",{role:"tabpanel",className:(0,a.Z)(l,o),hidden:n},t)}},65559:(e,t,n)=>{"use strict";n.d(t,{Z:()=>m});var r=n(87462),a=n(67294),l=n(86010),o=n(5730),i=n(20636),s=n(76602),c=n(63735),u="tabList__CuJ",d="tabItem_LNqP";function p(e){const{lazy:t,block:n,defaultValue:o,values:p,groupId:m,className:g}=e,f=a.Children.map(e.children,(e=>{if((0,a.isValidElement)(e)&&"value"in e.props)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)})),h=p??f.map((e=>{let{props:{value:t,label:n,attributes:r}}=e;return{value:t,label:n,attributes:r}})),y=(0,i.l)(h,((e,t)=>e.value===t.value));if(y.length>0)throw new Error(`Docusaurus error: Duplicate values "${y.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`);const b=null===o?o:o??f.find((e=>e.props.default))?.props.value??f[0].props.value;if(null!==b&&!h.some((e=>e.value===b)))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${b}" but none of its children has the corresponding value. Available values are: ${h.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);const{tabGroupChoices:k,setTabGroupChoices:v}=(0,s.U)(),[E,x]=(0,a.useState)(b),w=[],{blockElementScrollPositionUntilNextRender:C}=(0,c.o5)();if(null!=m){const e=k[m];null!=e&&e!==E&&h.some((t=>t.value===e))&&x(e)}const Z=e=>{const t=e.currentTarget,n=w.indexOf(t),r=h[n].value;r!==E&&(C(t),x(r),null!=m&&v(m,String(r)))},N=e=>{let t=null;switch(e.key){case"Enter":Z(e);break;case"ArrowRight":{const n=w.indexOf(e.currentTarget)+1;t=w[n]??w[0];break}case"ArrowLeft":{const n=w.indexOf(e.currentTarget)-1;t=w[n]??w[w.length-1];break}}t?.focus()};return a.createElement("div",{className:(0,l.Z)("tabs-container",u)},a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":n},g)},h.map((e=>{let{value:t,label:n,attributes:o}=e;return a.createElement("li",(0,r.Z)({role:"tab",tabIndex:E===t?0:-1,"aria-selected":E===t,key:t,ref:e=>w.push(e),onKeyDown:N,onClick:Z},o,{className:(0,l.Z)("tabs__item",d,o?.className,{"tabs__item--active":E===t})}),n??t)}))),t?(0,a.cloneElement)(f.filter((e=>e.props.value===E))[0],{className:"margin-top--md"}):a.createElement("div",{className:"margin-top--md"},f.map(((e,t)=>(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==E})))))}function m(e){const t=(0,o.Z)();return a.createElement(p,(0,r.Z)({key:String(t)},e))}},69762:(e,t,n)=>{"use strict";const r=(0,n(67294).createContext)({selectedValue:"",setSelectedValue:e=>{throw new Error("No Tab provider")},values:[]});t.Z=r},28423:(e,t,n)=>{"use strict";n.d(t,{Z:()=>x});var r=n(67294),a=n(87462),l=n(99401),o=n(6832),i=n(86010),s=n(49544),c=n(45045);function u(){return r.createElement(r.Fragment,null,r.createElement("script",{dangerouslySetInnerHTML:{__html:p},type:"application/javascript"}))}var d=(0,r.memo)(u);const p=`\nif (!/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(\n  navigator.userAgent,\n) && !window.monacoPreloaded) {\n[${["https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/editor/editor.main.nls.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/basic-languages/typescript/typescript.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsMode.js"].map((e=>`'${e}'`)).join(",")}].forEach(href => {\nwindow.monacoPreloaded = true;\nvar link = document.createElement("link");\nlink.href = href;\nlink.rel = "preload";\nlink.as = href.endsWith('.js') ? 'script' : 'style';\ndocument.head.appendChild(link);\n});\n[${["https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/base/worker/workerMain.js","https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs/language/typescript/tsWorker.js"].map((e=>`'${e}'`)).join(",")}].forEach(href => {\nwindow.monacoPreloaded = true;\nvar link = document.createElement("link");\nlink.href = href;\nlink.rel = "prefetch";\nlink.as = 'script';\ndocument.head.appendChild(link);\n});\n}\n`;var m=n(24338),g=n(80086),f=n(45440);function h(e){let{children:t,transformCode:n,groupId:c,defaultOpen:u,row:p,hidden:m,fixtures:g,includeEndpoints:h,...b}=e;const{liveCodeBlock:{playgroundPosition:k}}=(0,o.Z)().siteConfig.themeConfig,v=(0,l.p)();return r.createElement(r.Fragment,null,r.createElement("div",{className:(0,i.Z)(f.Z.playgroundContainer,{[f.Z.row]:p,[f.Z.hidden]:m})},r.createElement(s.nu,(0,a.Z)({theme:v},b),r.createElement(y,{reverse:"top"===k,row:p,fixtures:g,includeEndpoints:h,groupId:c,defaultOpen:u},t))),r.createElement(d,null))}function y(e){let{reverse:t,children:n,row:a,fixtures:l,includeEndpoints:o,groupId:i,defaultOpen:u}=e;const{handleCodeChange:d,codes:p,codeTabs:f}=(0,m.h)(n),h=p.join("\n");return r.createElement(v,{reverse:t},r.createElement(m.L,{fixtures:l,row:a,codeTabs:f,handleCodeChange:d,codes:p}),r.createElement(c.Z,{fallback:r.createElement(s.nu,{key:"preview",code:'render(() => "Loading...");',noInline:!0},r.createElement(g.Z,{key:"preview",includeEndpoints:o,groupId:i,defaultOpen:u,row:a,fixtures:l}))},r.createElement(k,{code:h,includeEndpoints:o,groupId:i,defaultOpen:u,row:a,fixtures:l})))}h.defaultProps={row:!1,hidden:!1};const b="object"==typeof navigator&&/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator?.userAgent),k=(0,r.lazy)((()=>b?Promise.resolve({default:e=>null}):Promise.all([n.e(86429),n.e(87876),n.e(73287),n.e(26750)]).then(n.bind(n,41380))));function v(e){let{children:t,reverse:n}=e;const r=[...t];return r.reverse(),n?r:t}v.defaultProps={reverse:!1};const E=e=>{let{children:t,groupId:n,hidden:a=!1,defaultOpen:l,row:o=!1,fixtures:i}=e;return r.createElement(h,{includeEndpoints:!Array.isArray(t),noInline:!0,groupId:n,defaultOpen:l,row:o,hidden:a,fixtures:i},"string"==typeof t||Array.isArray(t)?t:t.props.children)};E.defaultProps={defaultOpen:"n",fixtures:[]};var x=(0,r.memo)(E)},47885:(e,t,n)=>{"use strict";n.d(t,{Z:()=>o});var r=n(30433),a=n(65559),l=n(67294);function o(e){let{children:t}=e;return l.createElement(a.Z,{defaultValue:"ts",groupId:"language",values:[{label:"TypeScript",value:"ts"},{label:"JavaScript",value:"js"}]},l.createElement(r.Z,{value:"ts"},t[0]),l.createElement(r.Z,{value:"js"},t[1]))}},45045:(e,t,n)=>{"use strict";n.d(t,{Z:()=>l});var r=n(19666),a=n(67294);function l(e){let{fallback:t,children:n}=e;return a.createElement(r.Z,{fallback:t},(()=>a.createElement(a.Suspense,{fallback:t},n)))}},62974:(e,t,n)=>{"use strict";n.d(t,{Z:()=>o});var r=n(67294),a=n(86010),l=n(45440);function o(e){let{children:t,className:n,onClick:o}=e;return r.createElement("div",{className:(0,a.Z)(l.Z.playgroundHeader,n,o?l.Z.clickable:null),onClick:o},t)}},24338:(e,t,n)=>{"use strict";n.d(t,{L:()=>w,h:()=>C});var r=n(87462),a=n(11614),l=n(86010),o=n(67294),i=n(69762),s=n(13743),c=n(45440);function u(e){let{fixtures:t}=e;return o.createElement("div",{className:c.Z.fixtureBlock},t.map((e=>o.createElement("div",{key:e.endpoint.key(...e.args),className:c.Z.fixtureItem},o.createElement("div",{className:c.Z.fixtureHeader},e.endpoint.key(...e.args)),o.createElement(p,{fixture:e})))))}var d=(0,o.memo)(u);function p(e){let{fixture:t}=e;return"function"==typeof t.response?"function":o.createElement(s.Z,{language:"json",className:c.Z.fixtureJson},JSON.stringify(t.response))}var m=n(62974),g=n(49544);const f=(0,o.memo)(g.uz);var h=n(76226),y=n(30573);let b;if("undefined"!=typeof window&&!/bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent)){const e=["rest","core","react","endpoint","normalizr","graphql","hooks"],t=["react","rest-hooks","@rest-hooks/rest","@rest-hooks/react","@rest-hooks/graphql","@rest-hooks/hooks","bignumber.js"];if(!b){const r=y.Z.init();r.then((e=>{e&&(b=e,e.languages.typescript.typescriptDefaults.setCompilerOptions({allowNonTsExtensions:!0,target:e.languages.typescript.ScriptTarget.ES2017,jsx:e.languages.typescript.JsxEmit.React,strict:!0,strictNullChecks:!0,exactOptionalPropertyTypes:!0,lib:["dom","esnext"],module:e.languages.typescript.ModuleKind.ESNext,moduleResolution:e.languages.typescript.ModuleResolutionKind.NodeJs,typeRoots:["node_modules/@types"],allowSyntheticDefaultImports:!0,skipLibCheck:!0,noImplicitAny:!1}),e.editor.defineTheme("prism",{base:"vs-dark",inherit:!0,rules:[{token:"number",foreground:"f78c6c"},{token:"string",foreground:"b6d986"},{token:"keyword",fontStyle:"italic",foreground:"7da4f6"},{token:"type",foreground:"ffcb6b"},{token:"delimiter",foreground:"C792EA"},{token:"tag",foreground:"FF5590"}],colors:{"editor.foreground":"#bfc7d5","editor.inactiveSelectionBackground":"#484d5b"}}),e.languages.registerCompletionItemProvider("typescript",{triggerCharacters:["'",'"',".","/"],provideCompletionItems:(n,r)=>{const a=n.getValueInRange({startLineNumber:1,startColumn:1,endLineNumber:r.lineNumber,endColumn:r.column});if(/(([\s|\n]+from\s+)|(\brequire\b\s*\())["|'][^'^"]*$/.test(a)){if(a.endsWith(".")||a.endsWith("/")){const t=e.editor.getModels().map((e=>e.uri.path)).map((t=>{const n=/\/\d+\//g.exec(t)?.[0]??"",r=t.substring(n.length-1);return{label:r,insertText:r.replace(/\.tsx?$/,""),kind:e.languages.CompletionItemKind.Module}}));if(!t.length)return;return{suggestions:t}}return{suggestions:t.map((t=>({label:t,kind:e.languages.CompletionItemKind.Module,insertText:t})))}}}}))})),Promise.allSettled([r,n.e(37956).then(n.t.bind(n,70637,23)),n.e(49033).then(n.t.bind(n,7712,23)),n.e(42713).then(n.t.bind(n,93716,23)),n.e(78789).then(n.t.bind(n,52031,23)),...e.map((e=>n(73795)(`./${e}.d.ts`)))]).then((t=>{let[n,...r]=t;if("fulfilled"!==n.status||!n.value)return;const a=n.value,[l,o,i,s,...c]=r.map((e=>"fulfilled"===e.status?e.value.default:""));return a.languages.typescript.typescriptDefaults.addExtraLib("declare module \"react/jsx-runtime\" {\n        import './';\n      }","file:///node_modules/@types/react/jsx-runtime.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib("import * as React from 'react'\n\n    declare global {\n      namespace JSX {\n        interface IntrinsicElements {\n          strike: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;\n        }\n      }\n    }","file:///node_modules/@types/react/more.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib("declare function render(component:JSX.Element):void;\n        declare function CurrentTime(props: {}):JSX.Element;\n        declare function ResetableErrorBoundary(props: { children: JSX.ReactChild }):JSX.Element;\n        declare function randomFloatInRange(min: number, max: number, decimals?: number): number;"),a.languages.typescript.typescriptDefaults.addExtraLib(l,"es2022"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "react" { ${o} }`,"file:///node_modules/@types/react/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "bignumber.js" { ${i} }`,"file:///node_modules/bignumber.js/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "rest-hooks" { ${s} }`,"file:///node_modules/rest-hooks/index.d.ts"),a.languages.typescript.typescriptDefaults.addExtraLib(`declare globals { ${o} }`),c.forEach(((t,n)=>{const r=e[n];a.languages.typescript.typescriptDefaults.addExtraLib(`declare module "@rest-hooks/${r}" { ${t} }`,`file:///node_modules/@rest-hooks/${t}/index.d.ts`),["rest","react"].includes(r)&&a.languages.typescript.typescriptDefaults.addExtraLib(`declare globals { ${t} }`)})),a.languages.typescript.typescriptDefaults.setEagerModelSync(!0),a}))}}const k=(0,o.memo)(h.ZP);const v={scrollbar:{alwaysConsumeMouseWheel:!1},minimap:{enabled:!1},wordWrap:"on",scrollBeyondLastLine:!1,wrappingIndent:"indent",lineNumbers:"off",folding:!1,fontLigatures:!0,fontFamily:'"Roboto Mono",SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',fontSize:13,lineHeight:19},E={...v,fontSize:14,lineHeight:20};var x=n(3495).Z?function(e){let{onChange:t,code:n,path:r,autoFocus:a=!1,large:l=!1,...i}=e;const s=l?E:v;r.endsWith(".tsx")||r.endsWith(".ts")||(r+=".tsx");const[c,u]=(0,o.useState)("100%"),d=(0,o.useCallback)((e=>{a&&e.focus();const t=Object.keys(i).map((e=>/\{(\d+)\}/.exec(e)?.[1])).filter(Boolean);t.length&&e.setSelections(t.map((e=>{const t=Number.parseInt(e,10);return{selectionStartLineNumber:t,selectionStartColumn:0,positionLineNumber:t+1,positionColumn:0}})));const n=s.lineHeight,r=e.getDomNode(),l=r.getElementsByClassName("view-lines")[0];let o=0;const c=e.getModel().getLineCount()*n+10;r.style.height=c+"px",u(c),e.layout(),e.onDidChangeModelDecorations((()=>{setTimeout((()=>{const t=l.childElementCount*n+10;o=l.childElementCount,r.style.height=t+"px",u(c),e.layout()}),0)}))}),[]);return o.createElement(k,{path:r,defaultLanguage:"typescript",onChange:t,defaultValue:n,options:s,theme:"prism",onMount:d,height:c,loading:o.createElement(g.uz,{language:"tsx",code:n,disabled:!0})})}:function(e){let{onChange:t,code:n}=e;return o.createElement(f,{onChange:t,code:n})};function w(e){let{fixtures:t,row:n,codeTabs:a,handleCodeChange:i,codes:s,large:u=!1}=e;const d=(0,o.useMemo)((()=>(1e4*Math.random()).toPrecision(4).toString()),[]),[p,m]=(0,o.useState)((()=>a.map((e=>{let{collapsed:t}=e;return t}))));return o.createElement("div",null,o.createElement(P,{fixtures:!n&&t,title:n&&1===a.length?a[0].title:void 0}),n&&a.length>1?o.createElement(I,{titles:a.map((e=>{let{title:t}=e;return t})),closedList:p,onClick:e=>m((t=>t.map(((t,n)=>n!==e))))}):null,a.map(((e,t)=>{let{title:a,path:g,code:f,collapsed:h,...y}=e;return o.createElement(o.Fragment,{key:t},!n&&a?o.createElement(N,{onClick:()=>m((e=>{const n=[...e];return n[t]=!n[t],n})),closed:p[t],title:a}):null,o.createElement("div",{key:t,className:(0,l.Z)(c.Z.playgroundEditor,{[c.Z.hidden]:p[t]})},o.createElement(x,(0,r.Z)({key:t,onChange:i[t],code:s[t],path:"/"+d+"/"+(g||a||"default.tsx")},y,{large:u}))))})))}function C(e){const t=(0,o.useMemo)((()=>"string"==typeof e?[{code:e.replace(/\n$/,""),collapsed:!1}]:(Array.isArray(e)?e:[e]).filter((e=>e.props.children)).map((e=>"string"==typeof e.props.children?e.props:e.props.children.props)).map((e=>{let{children:t,title:n="",collapsed:r=!1,path:a,...l}=e;return{code:t.replace(/\n$/,""),title:n.replaceAll('"',""),collapsed:r,path:a,...l}}))),[e]),[n,r]=(0,o.useReducer)(Z,void 0,(()=>t.map((e=>{let{code:t}=e;return t}))));return{handleCodeChange:(0,o.useMemo)((()=>t.map(((e,t)=>e=>{r({i:t,code:e})}))),[t.length]),codes:n,codeTabs:t}}function Z(e,t){const n=[...e];return n[t.i]=t.code,n}function N(e){let{onClick:t,closed:n,title:r}=e;return o.createElement(m.Z,{className:c.Z.small,onClick:t},o.createElement("span",{className:(0,l.Z)(c.Z.arrow,n?c.Z.right:c.Z.down)},"\u25b6"),r)}function I(e){let{titles:t,closedList:n,onClick:r}=e;const{values:a}=(0,o.useContext)(i.Z),s=a.length>0;return o.createElement(m.Z,{className:(0,l.Z)({[c.Z.small]:s,[c.Z.subtabs]:s},c.Z.noupper,c.Z.tabControls)},o.createElement("div",{className:c.Z.tabs,role:"tablist","aria-orientation":"horizontal"},t.map(((e,t)=>o.createElement("div",{role:"tab",key:t,onClick:()=>r(t),className:(0,l.Z)(c.Z.tab,{[c.Z.selected]:!n[t]})},e)))))}function T(){const{selectedValue:e,setSelectedValue:t,values:n}=(0,o.useContext)(i.Z);return o.createElement("div",{className:c.Z.tabs,role:"tablist","aria-orientation":"horizontal"},n.map((n=>{let{value:r,label:a}=n;return o.createElement("div",{role:"tab",tabIndex:e===r?0:-1,"aria-selected":e===r,key:r,className:(0,l.Z)(c.Z.tab,{[c.Z.selected]:e===r}),onFocus:t,onClick:t,value:r},a)})))}function O(e){let{children:t}=e;return o.createElement(m.Z,{className:c.Z.tabControls},o.createElement("div",{className:c.Z.title},t),o.createElement(T,null))}function P(e){let{title:t,fixtures:n}=e;const{values:r}=(0,o.useContext)(i.Z),a=r.length>0;return o.createElement(o.Fragment,null,n.length?o.createElement(o.Fragment,null,o.createElement(m.Z,{className:c.Z.small},"Fixtures"),o.createElement(d,{fixtures:n})):null,a?o.createElement(O,null,t):null)}P.defaultProps={title:o.createElement(a.Z,{id:"theme.Playground.liveEditor",description:"The live editor label of the live codeblocks"},"Editor"),fixtures:[]}},80086:(e,t,n)=>{"use strict";n.d(t,{Z:()=>j});var r=n(67294),a=n(11614),l=n(76602),o=n(63735),i=n(39714),s=n(86010),c=n(92785),u=n(92954),d=n(48256),p=n(3604),m=n(45045),g=n(29451),f=n(50634),h=n(70524);function y(e){let{value:t}=e;const n="dark"===(0,h.I)().colorMode,a=(0,r.useMemo)((()=>({String:"rgb(195, 232, 141)",Date:"rgb(247, 140, 108)",Number:"rgb(247, 140, 108)",Boolean:"rgb(247, 140, 108)",Null:"rgb(255, 88, 116)",Undefined:"rgb(255, 88, 116)",Function:"rgb(247, 140, 108)",Symbol:"rgb(247, 140, 108)"})),[]),l=(0,r.useMemo)((()=>({tree:{overflow:"auto",flex:"4 1 70%",margin:0,padding:"0 0.5rem 0 0.8rem",backgroundColor:n?"var(--ifm-pre-background)":"rgb(41, 45, 62)",font:"var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace) !important",color:"rgb(227, 227, 227)"},arrowContainer:(e,t)=>{let{style:n}=e;return{style:{...n,fontFamily:"arial",padding:"7px 7px 7px 0",margin:"-7px calc(0.5em - 7px) -7px 0"}}},arrowSign:{color:"rgb(130, 170, 255)"},label:{color:"rgb(130, 170, 255)"},itemRange:{color:"rgb(105, 112, 152)"},valueText:(e,t)=>{let{style:n}=e;return{style:{...n,color:a[t]}}},base0B:"rgb(191, 199, 213)"})),[n,a]);return r.createElement(f.L,{shouldExpandNode:b,data:t,valueRenderer:v,theme:l,hideRoot:!0})}function b(e,t,n){return 0===n||(!(1!==n||!["entities","results"].includes(e[0]))||(2===n&&"entities"===e[1]||(2===n&&"results"===e[1]||(3===n&&"entities"===e[2]||3===n&&"results"===e[2]))))}const k="undefined"!=typeof Intl;function v(e,t){const n=arguments.length<=2?void 0:arguments[2];return k&&"number"==typeof t&&"string"==typeof n&&isFinite(t)&&("date"===n||n.endsWith("At"))?Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"numeric",second:"numeric",fractionalSecondDigits:3}).format(t):e}var E=n(45440);function x(e){let{toggle:t,selectedValue:n}=e;const a="y"===n,l=a?E.Z.right:E.Z.left;return r.createElement(r.Fragment,null,r.createElement("div",{className:E.Z.debugToggle,onClick:t},"Store",r.createElement("span",{className:(0,s.Z)(E.Z.arrow,l,E.Z.vertical)},"\u25b6")),a?r.createElement(Z,null):null)}var w=(0,r.memo)(x);function C(){const e=(0,r.useContext)(g.sA),t=(0,r.useMemo)((()=>{const t={...e};return delete t.optimistic,t}),[e]);return r.createElement(y,{value:t})}const Z=(0,r.memo)(C);function N(e){let{groupId:t,defaultOpen:n,row:a,fixtures:g}=e;const{tabGroupChoices:f,setTabGroupChoices:h}=(0,l.U)(),[y,b]=(0,r.useState)(n),{blockElementScrollPositionUntilNextRender:k}=(0,o.o5)();if(null!=t){const e=f[t];null!=e&&e!==y&&b(e)}const v=(0,r.useCallback)((e=>{k(e.currentTarget),b((e=>"y"===e?"n":"y")),h(t,"y"===y?"n":"y")}),[k,t,y,h]),x=(0,r.useMemo)((()=>[new c.Z,new u.Z(d.Z)]),[]),C=!("n"===y||!a);return r.createElement(p.Z,{managers:x},r.createElement(i.Z,{fixtures:g,silenceMissing:!0},r.createElement("div",{className:(0,s.Z)(E.Z.playgroundPreview,{[E.Z.hidden]:C})},r.createElement(m.Z,{fallback:r.createElement(T,null)},r.createElement(O,null))),r.createElement(w,{selectedValue:y,toggle:v})))}var I=(0,r.memo)(N);function T(){return r.createElement("div",null,"Loading...")}const O=(0,r.lazy)((()=>Promise.all([n.e(86429),n.e(87876),n.e(73287),n.e(26750)]).then(n.bind(n,15929))));var P=n(62974);function L(e){let{groupId:t,defaultOpen:n,row:l,fixtures:o}=e;return r.createElement("div",{style:{overflow:"hidden",display:"flex",flexDirection:"column"}},r.createElement(P.Z,null,r.createElement(a.Z,{id:"theme.Playground.result",description:"The result label of the live codeblocks"},"Live Preview")),r.createElement("div",{className:E.Z.playgroundResult},r.createElement(I,{groupId:t,defaultOpen:n,row:l,fixtures:o})))}var j=(0,r.memo)(L)},3495:(e,t)=>{"use strict";const n="undefined"!=typeof window&&!/bot|googlebot|crawler|spider|robot|crawling|Mobile|Android|BlackBerry/i.test(navigator.userAgent);t.Z=n},57489:(e,t,n)=>{"use strict";var r=n(67294),a=n(64820);const l={React:r,...r,...a};t.Z=l},3905:(e,t,n)=>{"use strict";n.d(t,{Zo:()=>u,kt:()=>m});var r=n(67294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},l=Object.keys(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=r.createContext({}),c=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},u=function(e){var t=c(e.components);return r.createElement(s.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},p=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,l=e.originalType,s=e.parentName,u=i(e,["components","mdxType","originalType","parentName"]),p=c(n),m=a,g=p["".concat(s,".").concat(m)]||p[m]||d[m]||l;return n?r.createElement(g,o(o({ref:t},u),{},{components:n})):r.createElement(g,o({ref:t},u))}));function m(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var l=n.length,o=new Array(l);o[0]=p;var i={};for(var s in t)hasOwnProperty.call(t,s)&&(i[s]=t[s]);i.originalType=e,i.mdxType="string"==typeof e?e:a,o[1]=i;for(var c=2;c<l;c++)o[c]=n[c];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}p.displayName="MDXCreateElement"},45440:(e,t)=>{"use strict";t.Z={playgroundContainer:"playgroundContainer_sLUA",standaloneEditor:"standaloneEditor_OHub",row:"row_YGZs",playgroundHeader:"playgroundHeader_Zx4K",tabControls:"tabControls_trxh",hidden:"hidden_Hh8i",small:"small_xksL",clickable:"clickable_YHiX",noupper:"noupper_WDCF",subtabs:"subtabs_XtJb",playgroundEditor:"playgroundEditor_lYwu",closed:"closed_QJMa",arrow:"arrow_tivA",vertical:"vertical_OMeC",right:"right_vs_C",left:"left_iDcB",up:"up_H4F7",down:"down_oRky",playgroundPreview:"playgroundPreview_rk9R",playgroundError:"playgroundError_sRnA",playgroundResult:"playgroundResult_tefG",debugToggle:"debugToggle_zlro",title:"title_poUY",tabs:"tabs_m54V",tab:"tab_bTGw",selected:"selected_QXZk",fixtureBlock:"fixtureBlock_mpRK",fixtureItem:"fixtureItem_Jd6V",fixtureHeader:"fixtureHeader_KYel",fixtureJson:"fixtureJson_HnbR"}},73795:(e,t,n)=>{var r={"./core.d.ts":[90734,30007],"./endpoint.d.ts":[73118,72901],"./graphql.d.ts":[60467,99076],"./hooks.d.ts":[56890,22595],"./normalizr.d.ts":[14991,12192],"./react.d.ts":[61019,97359],"./rest.d.ts":[42714,46324]};function a(e){if(!n.o(r,e))return Promise.resolve().then((()=>{var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}));var t=r[e],a=t[0];return n.e(t[1]).then((()=>n.t(a,23)))}a.keys=()=>Object.keys(r),a.id=73795,e.exports=a}}]);