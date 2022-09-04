import { styled } from '@linaria/react';

const FlexRow = styled.div`
  display: flex;
  flex-direciton: row;
  justify-content: space-between;
  width: 100%;
  & > :last-child {
    flex-shrink: 0;
  }
`;
export default FlexRow;
