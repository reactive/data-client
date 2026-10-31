import type { Manager } from '@data-client/core';

/** Managers DataProvider adds on this platform; see platformManagers.native.ts */
export default function platformManagers(managers: Manager[]): Manager[] {
  return managers;
}
