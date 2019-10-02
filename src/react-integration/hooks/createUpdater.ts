import { OptimisticUpdateFunction } from '~/types';

type SimpleUpdateFunction = (fromResults: any, toResults: any) => any;

/**
 * Function generator that creates a merge function that merges an entity into results
 *
 * @param fromSchema The schema for the entity that we want to add to the toSchema
 * @param toSchema The schema that represents the results we are merging into
 * @param updateFunction The user-provided update function that merges the entity
 *   returned in the fromSchema into the results of shape toSchema
 */
export default function createUpdater(
  fromSchema: any,
  toSchema: any,
  updateFunction: SimpleUpdateFunction,
): OptimisticUpdateFunction {
  console.log(fromSchema, toSchema, updateFunction);
  return (fromResults: any, resultsFromList: any): any => {
    // TODO: Correctly match entities
    return resultsFromList;
  };
}
