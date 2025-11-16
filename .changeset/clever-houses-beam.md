---
'@data-client/core': patch
---

Add @data-client/core/mock

New exports:
- `MockController` - Controller wrapper for mocking endpoints
- `collapseFixture` - Resolves fixture responses (handles function responses)
- `createFixtureMap` - Separates fixtures into static map and interceptors
- Types: `MockProps`, `Fixture`, `SuccessFixture`, `ErrorFixture`, `Interceptor`, `ResponseInterceptor`, `FetchInterceptor`, `FixtureEndpoint`, `SuccessFixtureEndpoint`, `ErrorFixtureEndpoint`
