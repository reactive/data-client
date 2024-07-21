---
title: Django Auth and CSRF handling | Reactive Data Client
sidebar_label: Django Integration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# Django Integration

## Cookie Auth + CSRF

Django add protection against Cross Site Request Forgery, by [requiring the 'X-CSRFToken' header in requests](https://docs.djangoproject.com/en/5.0/howto/csrf/#using-csrf-protection-with-ajax).

Additionally Django's authentication uses [cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies), so we need to send credentials [fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included). If you use
an auth type other than the default 'django.contrib.auth', see [authentication guide](./auth.md) for more examples.

<EndpointPlayground input="/my/1" init={{method: 'GET', headers: {'Content-Type': 'application/json', 'X-CSRFToken': 'xyz', 'Cookie': 'session=abc;'}}} status={200} response={{  "id": "1","title": "this post"}}>

```ts title="getCookie" collapsed
export default function getCookie(name): string {
  let cookieValue = '';
  if (document.cookie && document.cookie != '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
```

```ts title="DjangoEndpoint"
import { RestEndpoint } from '@data-client/rest';
import getCookie from './getCookie';

export default class DjangoEndpoint<
  O extends RestGenerics = any,
> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return {
      ...(await super.getRequestInit(body)),
      credentials: 'same-origin',
    };
  }
  getHeaders(headers: HeadersInit) {
    if (this.method === 'GET') return headers;
    return {
      ...headers,
      'X-CSRFToken': getCookie('csrftoken'),
    };
  }
}
```

```ts title="MyResource" collapsed {15}
import { resource, Entity } from '@data-client/rest';
import DjangoEndpoint from './DjangoEndpoint';

class MyEntity extends Entity {
  id = '';
  title = '';
  pk() {
    return this.id;
  }
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: DjangoEndpoint,
});
```

```ts title="Request" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>