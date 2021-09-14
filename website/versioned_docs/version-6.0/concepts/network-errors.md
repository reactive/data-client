---
title: Dealing with network errors
---

When you use the `useResource()` hook, React will suspend rendering while the network
request takes place. But what happens if there is a network failure? It will
throw the network error. When this happens you'll want to have an
[error boundary](https://reactjs.org/docs/error-boundaries.html) set up to handle it.
Most likely you'll want to place one specifically for network errors at the same place
you put your `<Suspense>`. What you do with the error once you catch it, is of course
up to you.

## Error Boundary

This library provides `NetworkErrorBoundary` component that only catches network
errors and sends them to a fallback component you provide. Other errors will rethrow.

```tsx
import { Suspense } from 'react';
import { NetworkErrorBoundary } from 'rest-hooks';
import { RouteChildrenProps } from 'react-router';

const App = ({ location }: RouteChildrenProps) => (
  <Suspense fallback={<Spinner />}>
    <NetworkErrorBoundary>
      <Routes />
    </NetworkErrorBoundary>
  </Suspense>
)
```

Alternatively you could create your own error boundary where you might
try dispatching the errors to another provider to use in a transient
popup.

Additionally you could also use one error boundary for any error
type and handle network errors there.

## Without Error Boundary

Error boundaries provide elegant ways to reduce complexity by handling many
errors in the react tree in one location. However, if you find yourself wanting to handle
error state manually you can adapt the [useStatefulResource()](../guides/no-suspense.md) hook.

## Errors from Mutates (imperative)

Since mutations are called imperatively, their function will throw an error if there
is a network error like 400 because the form values were invalid.

Let's look at the update form example from the introduction.

```tsx
import { useFetcher } from 'rest-hooks';
import ArticleResource from 'resources/article';

export default function UpdateArticleForm({ id }: { id: number }) {
  const article = useResource(ArticleResource.detail(), { id });
  const update = useFetcher(ArticleResource.update());
  // update as (body: Readonly<Partial<ArticleResource>>, params?: Readonly<object>) => Promise<any>
  return (
    <Form
      onSubmit={e => update({ id }, new FormData(e.target))}
      initialValues={article}
    >
      <FormField name="title" />
      <FormField name="content" type="textarea" />
      <FormField name="tags" type="tag" />
    </Form>
  );
}
```

The function we pass to `<Form />` calls the update fetch. This means that it
will pass through any errors that occur with that fetch.

To handle this the Form component should control form error state.

```tsx
function Form({ onSubmit, initialValues, children }: FormState) {
  const [errors, setErrors] = useState<null | Error>(null);
  const formData = useFormData(); // this is an example interface

  const handleSubmit = useCallback(() => {
    try {
      return onSubmit(formData);
    } catch(e) {
      // We set the form error state when we catch an error from our network call
      setErrors(e);
    }
  }, [setErrors, onSubmit]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Show the form errors at the top */}
      <FormError error={error} />
      {children}
    </form>
  )
}
```
