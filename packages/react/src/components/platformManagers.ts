import type { Manager } from '@data-client/core';

/** Web needs no platform managers; see platformManagers.native.ts */
export default function platformManagers(managers: Manager[]): Manager[] {
  return managers;
}
