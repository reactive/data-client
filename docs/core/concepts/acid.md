---
title: 'ACID Data Clients'
sidebar_label: ACID safety
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# ACID



## Atomicity {#atomicity}

Data is often displayed in multiple locations (both in space and time). Atomicity guarantees that
every mutation 

 Atomicity
 guarantees that each transaction is treated as a single "unit", which 
either succeeds completely or fails completely: if any of the statements
 constituting a transaction fails to complete, the entire transaction 
fails and the database is left unchanged. An atomic system must 
guarantee atomicity in each and every situation, including power 
failures, errors, and crashes.[4]
 A guarantee of atomicity prevents updates to the database from 
occurring only partially, which can cause greater problems than 
rejecting the whole series outright. As a consequence, the transaction 
cannot be observed to be in progress by another database client. At one 
moment in time, it has not yet happened, and at the next, it has already
 occurred in whole (or nothing happened if the transaction was canceled 
in progress).

## Consistency



## Isolation

## Durability