export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-violet-800 bg-zinc-900 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={`text-lg font-semibold text-violet-200 ${className}`}>{children}</h2>;
}
