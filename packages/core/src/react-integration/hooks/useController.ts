import { useContext } from 'react';
import Controller from '@rest-hooks/core/controller/Controller';
import { ControllerContext } from '@rest-hooks/core/react-integration/context';

/**
 * Imperative control of Rest Hooks store
 * @see https://resthooks.io/docs/api/useController
 */
export default function useController(): Controller {
  return useContext(ControllerContext);
}
