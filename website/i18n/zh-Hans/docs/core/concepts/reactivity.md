---
title: 如何借助响应式实现扩展
sidebar_label: 响应式
draft: true
---

<head>
  <meta name="docsearch:pagerank" content="40"/>
</head>

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import LanguageTabs from '@site/src/components/LanguageTabs';
import Link from '@docusaurus/Link';


{/*
NOTE TO SELF: draw parallel to react vs jquery

Stages:
- local state to component
  - jquery and setstate are equivalent the innovation of react was resusable components and declarative DOM updates
- global
  - it is hard to be aware of every place we must update.
  - tightly coupled all our usages to our update?
  - [show diagram of one to many]
- multiple endpoints & parameterizations (list, get)
- relational data, nesting, client-side joins
  - now our data needs to update not just our own endpoints but related ones


"Backbone models for the reactive era"
*/}


## 推送与拉取 {#push-vs-pull}

我们把这个过程反转过来。不再试图把更新推送到所有相关的位置