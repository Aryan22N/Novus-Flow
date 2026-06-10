export default function IsometricLoader() {
  return (
    <div className="flex items-center justify-center h-32 w-full">
      <div 
        className="relative w-16 h-16"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(60deg) rotateZ(45deg)",
        }}
      >
        <div 
          className="absolute inset-0 border-[6px] border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          style={{
            animation: "isometric-pulse 2s ease-in-out infinite alternate",
          }}
        />
        <div 
          className="absolute inset-0 border-[6px] border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]"
          style={{
            transform: "translateZ(20px)",
            animation: "isometric-pulse-2 2s ease-in-out infinite alternate-reverse",
          }}
        />
        <div 
          className="absolute inset-0 border-[6px] border-blue-300 shadow-[0_0_15px_rgba(147,197,253,0.5)]"
          style={{
            transform: "translateZ(40px)",
            animation: "isometric-pulse 2s ease-in-out infinite alternate",
          }}
        />
      </div>
      <style>{`
        @keyframes isometric-pulse {
          0% { transform: translateZ(0px) scale(1); opacity: 0.5; }
          100% { transform: translateZ(40px) scale(1.1); opacity: 1; }
        }
        @keyframes isometric-pulse-2 {
          0% { transform: translateZ(20px) scale(1.1); opacity: 1; }
          100% { transform: translateZ(60px) scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
