import React from 'react';
import parseLink from 'parse-link-header';
import { Pagination } from 'antd';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { History } from 'history';

const handleChange =
  (history: History<any>) => (page: number, pageSize?: number) => {
    history.push(history.location.pathname + `?page=${page}`);
  };

interface PageProps extends RouteComponentProps {
  link: string;
}
function LinkPagination({ link, history }: PageProps) {
  const parsed = parseLink(link);
  const curPage =
    parsed && parsed.next
      ? Number.parseInt(parsed.next.page) - 1
      : parsed && parsed.prev
      ? Number.parseInt(parsed.prev.page) + 1
      : 1;
  let total, pageSize;
  if (!parsed) {
    total = 1;
    pageSize = 50;
  } else if (parsed.last) {
    total = Number.parseInt(parsed.last.page);
    pageSize = Number.parseInt(parsed.last.per_page);
  } else {
    pageSize = Number.parseInt(parsed.first.per_page);
    total = curPage;
  }
  return (
    <Pagination
      defaultCurrent={curPage}
      total={total * pageSize}
      pageSize={pageSize}
      onChange={handleChange(history)}
    />
  );
}

export default withRouter(LinkPagination);
