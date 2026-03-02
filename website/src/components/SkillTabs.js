import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export default function SkillTabs({ repo = 'reactive/data-client', skill }) {
  const skillFlag = skill ? ` --skill ${skill}` : '';
  return (
    <Tabs
      defaultValue="skills"
      groupId="agent-skills-program"
      values={[
        { label: 'Skills', value: 'skills' },
        { label: 'OpenSkills', value: 'openskills' },
      ]}
    >
      <TabItem value="skills">
        <CodeBlock className="language-bash">
          npx skills add {repo}
          {skillFlag}
        </CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">
          npx openskills install {repo}
          {skillFlag}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
