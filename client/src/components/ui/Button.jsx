export default function Button({
  children,
  onClick,
  variant = "default",
  className = "",
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-violet-500 text-white hover:bg-violet-400 border border-violet-400",
    secondary: "bg-zinc-900 text-violet-200 hover:bg-violet-100 hover:text-black border border-violet-700",
    ghost: "bg-transparent text-violet-300 hover:bg-violet-100 hover:text-black",
  };

  return (
    <button type={type} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
