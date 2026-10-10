export type PackageManager = 'npm' | 'yarn' | 'pnpm';

/** Tabs groupId shared by every package install snippet */
export const PACKAGE_MANAGER_TAB_GROUP = 'node-packages-program';

/** Shell command that installs `pkgs` with the given package manager */
export function installCommand(
  manager: PackageManager,
  pkgs: string,
  { dev = false, global = false }: { dev?: boolean; global?: boolean } = {},
): string {
  switch (manager) {
    case 'yarn':
      return `yarn ${global ? 'global ' : ''}add ${dev ? '--dev ' : ''}${pkgs}`;
    case 'pnpm':
      return `pnpm add ${global ? '-g ' : ''}${dev ? '-D ' : ''}${pkgs}`;
    default:
      return `npm install ${
        global ? '-g'
        : dev ? '--save-dev'
        : '--save'
      } ${pkgs}`;
  }
}
