import { GithubEntity, githubResource } from './Base';
import PreviewEndpoint from './PreviewEndpoint';

export class Label extends GithubEntity {
  nodeId = '';
  name = '';
  description = '';
  color = '000000';
  default = false;
}
export const LabelResource = githubResource({
  path: '/repos/:owner/:repo/labels/:name',
  schema: Label,
  Endpoint: PreviewEndpoint,
});

export default LabelResource;
