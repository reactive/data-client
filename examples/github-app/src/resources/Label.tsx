import { GithubEntity, createGithubResource } from './Base';
import PreviewEndpoint from './PreviewEndpoint';

export class Label extends GithubEntity {
  readonly nodeId: string = '';
  readonly name: string = '';
  readonly description: string = '';
  readonly color: string = '000000';
  readonly default: boolean = false;

  pk() {
    return this.id?.toString();
  }
}
export const LabelResource = createGithubResource({
  path: '/repos/:owner/:repo/labels/:name',
  schema: Label,
  Endpoint: PreviewEndpoint,
});

export default LabelResource;
