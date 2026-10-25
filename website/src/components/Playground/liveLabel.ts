import { translate } from '@docusaurus/Translate';

/** The preview's "Live Preview" label text */
export const liveLabel = () =>
  translate({
    id: 'theme.Playground.result',
    description: 'The result label of the live codeblocks',
    message: 'Live Preview',
  });

/** The code's "Editor" label text (the editor's header; the preview's
 * header while a demo's code shows) */
export const editorLabel = () =>
  translate({
    id: 'theme.Playground.liveEditor',
    description: 'The live editor label of the live codeblocks',
    message: 'Editor',
  });
