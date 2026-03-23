export default function ListBlock({ items }) {
  return (
    <ul className="my-4 space-y-2">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start text-gray-700 dark:text-gray-300"
        >
          <span className="text-blue-500 mr-3 mt-1">▸</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
