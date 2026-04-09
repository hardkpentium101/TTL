import React from 'react';
import HeadingBlock from './blocks/HeadingBlock';
import ParagraphBlock from './blocks/ParagraphBlock';
import CodeBlock from './blocks/CodeBlock';
import VideoBlock from './blocks/VideoBlock';
import MCQBlock from './blocks/MCQBlock';
import ListBlock from './blocks/ListBlock';
import LinkBlock from './blocks/LinkBlock';

const blockComponents = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
  list: ListBlock,
  link: LinkBlock,
};

export default function LessonRenderer({ content }) {
  if (!content || !Array.isArray(content)) {
    return <p className="text-[var(--text-muted)]">No content available</p>;
  }

  return (
    <div className="space-y-6" role="article" aria-label="Lesson content">
      {content.map((block, index) => {
        const BlockComponent = blockComponents[block.type];
        if (!BlockComponent) {
          console.warn(`Unknown block type: ${block.type}`);
          return (
            <div
              key={`unknown-${index}`}
              className="card p-4 border-l-4 border-l-[var(--warning)] bg-[var(--warning-bg)]"
            >
              <p className="text-sm text-[var(--text-muted)]">
                Unsupported content block: <code className="font-mono text-[var(--text-secondary)]">{block.type}</code>
              </p>
            </div>
          );
        }
        return <BlockComponent key={`${block.type}-${index}`} {...block} />;
      })}
    </div>
  );
}
