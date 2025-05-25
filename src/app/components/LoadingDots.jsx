export default function LoadingDots() {
  return (
    <div className="flex space-x-1 items-center">
      <div className="w-2 h-2 bg-[#E3742E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-[#E3742E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-[#E3742E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
} 