export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-medium shadow ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
