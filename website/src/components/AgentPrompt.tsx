import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React, { useCallback, useId } from 'react';

import styles from './AgentPrompt.module.css';
import useFramework from './useFramework';
import useTapped from './useTapped';

const FEEDBACK_MS = 2000;

interface Props {
  /** what to type into the agent; defaults to the prompt that sets up Data Client */
  prompt?: string;
  /** the agent, when only one understands the prompt, like "Cursor" */
  title?: string;
  /** a full-width chat box with a header, where the page has room */
  framed?: boolean;
}

/** Text to type into a coding agent's chat, not a terminal: a chip that copies
 * itself (click, tap or Enter) and says so in a tooltip.
 * MDX ```prompt fences render as this (theme/CodeBlock). */
export default function AgentPrompt({ prompt, title, framed }: Props) {
  const framework = useFramework();
  prompt ??= translate(
    {
      id: 'agentPrompt.prompt',
      message: 'Use `@data-client/{framework}` for all server state',
      description:
        'Prompt readers copy into their coding agent. Keep the backticks around package names: they keep each name on one line.',
    },
    { framework },
  );
  const tipId = useId();
  // the check icon and the tooltip (which touch screens, lacking hover, need)
  // show for a moment after a copy; leaving the chip ends both
  const [copied, showCopied, hideCopied] = useTapped(FEEDBACK_MS);
  const copy = useCallback(() => {
    // no clipboard (insecure context) or a denied write leaves the chip as it was
    navigator.clipboard?.writeText(prompt).then(showCopied, () => undefined);
  }, [prompt, showCopied]);

  const header =
    title ?
      translate(
        {
          id: 'agentPrompt.titleFor',
          message: '{agent} agent chat',
          description:
            'Header of text readers type into one coding agent (like Cursor), not a terminal',
        },
        { agent: title },
      )
    : translate({
        id: 'agentPrompt.title',
        message: 'Agent chat',
        description:
          'Header of text readers type into their coding agent, not a terminal',
      });
  const copyTip =
    title ?
      translate(
        {
          id: 'agentPrompt.copyFor',
          message: 'Copy prompt for {agent}',
          description:
            'Tooltip of an agent prompt only one coding agent (like Cursor) understands, which copies itself when clicked',
        },
        { agent: title },
      )
    : translate({
        id: 'agentPrompt.copy',
        message: 'Copy prompt for your coding agent',
        description:
          'Tooltip of the agent prompt, which copies itself when clicked',
      });

  return (
    <div className={clsx(styles.agentPrompt, framed && styles.framed)}>
      <button
        type="button"
        className={clsx('clean-btn', styles.prompt, copied && styles.copied)}
        aria-describedby={tipId}
        onClick={copy}
        onBlur={hideCopied}
      >
        <SparklesIcon className={styles.spark} />
        {framed && <span className={styles.label}>{header}</span>}
        <span className={styles.text}>
          {/* markdown code spans mark package names, which never break at their hyphen */}
          {prompt.split('`').map((part, i) =>
            i % 2 ?
              <span key={i} className={styles.pkg}>
                {part}
              </span>
            : part,
          )}
        </span>
        <span className={styles.copyIcons} aria-hidden="true">
          <CopyIcon className={styles.copyIcon} />
          <CheckIcon className={styles.checkIcon} />
        </span>
      </button>
      <span role="tooltip" id={tipId} className={styles.tip} aria-live="polite">
        {copied ?
          translate({
            id: 'agentPrompt.copied',
            message: 'Copied',
            description: 'Shown for a moment after the agent prompt is copied',
          })
        : copyTip}
      </span>
    </div>
  );
}

// Lucide icons (ISC): sparkles, copy, check
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...strokeProps}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;
