---
'@data-client/rest': patch
'@rest-hooks/rest': patch
---

Collection based pagination now replaces the non-list members on page

This allows members like nextPage or 'cursor' to be updated when
each page is fetched making it easier to know which page to fetch next.