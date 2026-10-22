---
title: Autenticación y manejo de CSRF con Django | Reactive Data Client
sidebar_label: Integración con Django
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import EndpointPlayground from '@site/src/components/HTTP/EndpointPlayground';

# Integración con Django

## Autenticación por cookies + CSRF {#cookie-auth--csrf}

Django añade protección contra Cross Site Request Forgery, al [requerir el header 'X-CSRFToken' en las peticiones](https://docs.djangoproject.com/en/5.0/howto/csrf/#using-csrf-protection-with-ajax).

Además, la autenticación de Django usa [cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies), por lo que debemos enviar las credenciales con [fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included). Si usas
un tipo de autenticación distinto del 'django.contrib.auth' por defecto, consulta la [guía de autenticación](./auth.md) para ver más ejemplos.

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
import { RestEndpoint, type RestGenerics } from '@data-client/rest';
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
}

export const MyResource = resource({
  path: '/my/:id',
  schema: MyEntity,
  Endpoint: DjangoEndpoint,
});
```

```ts title="Usage" column
import { MyResource } from './MyResource';
MyResource.get({ id: 1 });
```

</EndpointPlayground>