export default function ParagraphBlock({ text }) {
  return (
    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
      {text}
    </p>
  );
}
