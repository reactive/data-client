import { FetchShape } from '@rest-hooks/core/endpoint';
import { ReceiveTypes } from '@rest-hooks/core/types';
import {
  RECEIVE_TYPE,
  RECEIVE_DELETE_TYPE,
} from '@rest-hooks/core/actionTypes';

const SHAPE_TYPE_TO_RESPONSE_TYPE: Record<
  FetchShape<any, any, any>['type'],
  ReceiveTypes
> = {
  read: RECEIVE_TYPE,
  mutate: RECEIVE_TYPE,
  delete: RECEIVE_DELETE_TYPE,
};
export default SHAPE_TYPE_TO_RESPONSE_TYPE;
