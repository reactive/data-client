import PreviewResource from './PreviewResource';

export default class LabelResource extends PreviewResource {
  readonly id: number | undefined = undefined;
  readonly nodeId: string = '';
  readonly name: string = '';
  readonly description: string = '';
  readonly color: string = '000000';
  readonly default: boolean = false;

  pk() {
    return this.id?.toString();
  }

  static urlRoot =
    'https\\://api.github.com/repos/:owner/:repo/labels/:name?' as const;
}
