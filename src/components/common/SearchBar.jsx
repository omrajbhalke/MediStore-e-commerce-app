import { useRef } from "react";

export default function SearchBar({ value, onChange, onSearch, placeholder }) {
  const ref = useRef(null);

  function handleKey(e) {
    if (e.key === "Enter") onSearch?.(value);
  }

  return (
    <div className="relative w-full">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </span>
      <input
        ref={ref}
        className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800 outline-none focus:border-brand transition-colors duration-150"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "Search…"}
      />
      {value && (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-lg leading-none p-0.5"
          onClick={() => { onChange(""); onSearch?.(""); }}
        >
          ×
        </button>
      )}
    </div>
  );
}
