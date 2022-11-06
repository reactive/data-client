---
title: Lifecycle controlflow diagrams using Mermaid
authors: [ntucker]
tags:
  [
    lifecycle,
    control flow,
    diagram,
    mermaid,
    docusarus,
    documentation
  ]
---

import RestEndpointLifecycle from '../../docs/rest/diagrams/\_restendpoint_lifecycle.mdx';
import EndpointLifecycle from '../../docs/rest/diagrams/\_endpoint_success_lifecycle.mdx';
import EndpointErrorLifecycle from '../../docs/rest/diagrams/\_endpoint_error_lifecycle.mdx';
import EntityLifeCycle from '../../docs/rest/diagrams/\_entity_lifecycle.mdx';

[Mermaid](https://mermaid-js.github.io/mermaid/) is a cool way of creating diagrams in markdown.
It was recently integrated into Github Markdown and [added to this site's framework](https://docusaurus.io/blog/releases/2.2#mermaid-diagrams)
as well.

A lot of concepts are much easy to convey using visualizations so we quickly started using this
in the docs. To start off we have added control flow diagrams to help with hooking into the lifecycles
of Rest Hooks for customizations as well as understanding how it operates.

### [RestEndpoint](/rest/api/RestEndpoint#fetch-lifecycle)

<RestEndpointLifecycle/>

<!--truncate-->

### [Endpoint Success](/rest/api/Endpoint#success)

<EndpointLifecycle/>

### [Endpoint Error](/rest/api/Endpoint#error)

<EndpointErrorLifecycle/>

### [Entity](/rest/api/Entity#data-lifecycle)

<EntityLifeCycle/>
