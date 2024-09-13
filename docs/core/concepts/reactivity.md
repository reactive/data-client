---
title: How to scale using Reactivity 
sidebar_label: Reactivity
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


## Push vs Pull

We invert this process. Instead of attempting to push updates to all relevant locations