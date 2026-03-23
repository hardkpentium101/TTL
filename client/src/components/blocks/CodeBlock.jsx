export default function CodeBlock({ language, text }) {
  return (
    <div className="my-4 rounded-lg overflow-hidden">
      <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm font-mono">
        {language || 'code'}
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto">
        <code className="text-sm font-mono">{text}</code>
      </pre>
    </div>
  );
}
