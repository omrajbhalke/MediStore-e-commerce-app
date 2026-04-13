export default function Loader({ text = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-9 h-9 border-4 border-gray-200 border-t-brand rounded-full animate-spin-slow" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
