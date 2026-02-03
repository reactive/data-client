import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export default function SkillTabs({ skill }) {
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
        <CodeBlock className="language-bash">npx skills add {skill}</CodeBlock>
      </TabItem>
      <TabItem value="openskills">
        <CodeBlock className="language-bash">
          npx openskills install {skill}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
