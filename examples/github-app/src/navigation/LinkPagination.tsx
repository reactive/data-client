import { useController } from '@anansi/router';
import { Pagination } from 'antd';
import type { History } from 'history';
import parseLink from 'parse-link-header';

const handleChange =
  (history: History) => (page: number, pageSize?: number) => {
    history.push(history.location.pathname + `?page=${page}`);
  };

interface PageProps {
  link: string;
}
function LinkPagination({ link }: PageProps) {
  const controller = useController();
  const parsed = parseLink(link);
  const curPage =
    parsed && parsed.next
      ? Number.parseInt(parsed.next.page ?? '0') - 1
      : parsed && parsed.prev
      ? Number.parseInt(parsed.prev.page ?? '0') + 1
      : 1;
  let total;
  if (!parsed) {
    total = 1;
  } else if (parsed.last) {
    total = Number.parseInt(parsed.last.page ?? '0');
  } else {
    total = curPage;
  }
  if (total === 1) return null;
  return (
    <Pagination
      defaultCurrent={curPage}
      total={total * 20}
      pageSize={20}
      onChange={handleChange(controller.history)}
    />
  );
}

export default LinkPagination;
