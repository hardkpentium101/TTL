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
    return <p className="text-gray-500">No content available</p>;
  }

  return (
    <div className="space-y-2">
      {content.map((block, index) => {
        const BlockComponent = blockComponents[block.type];
        if (!BlockComponent) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }
        // Create unique key based on block type and content
        const uniqueKey = `${block.type}-${index}-${block.text || block.query || block.question || ''}`.slice(0, 50);
        return <BlockComponent key={uniqueKey} {...block} />;
      })}
    </div>
  );
}
