export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium shadow ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
