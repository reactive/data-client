import { useQuery } from '@data-client/react';
import { styled } from '@linaria/react';
import { queryRemainingTodos, queryTotalTodos } from 'resources/TodoResource';

export default function TodoStats({ userId }: { userId?: number }) {
  const remaining = useQuery(queryRemainingTodos, { userId });
  const total = useQuery(queryTotalTodos, { userId });

  return (
    <Footer>
      <Count>{remaining ?? 0} items left</Count>
      <Total>{total} total</Total>
    </Footer>
  );
}

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
  color: #666;
`;

const Count = styled.span`
  font-weight: 600;
`;

const Total = styled.span`
  color: #9e9e9e;
`;
