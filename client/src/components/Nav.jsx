export default function Nav({ pages, current, onSelect }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onSelect(page)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              page === current
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
    </nav>
  );
}
