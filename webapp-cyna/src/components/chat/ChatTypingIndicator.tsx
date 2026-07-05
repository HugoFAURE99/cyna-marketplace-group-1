// Custom three-dot "CynAI is thinking" loader.
export default function ChatTypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-purple-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
