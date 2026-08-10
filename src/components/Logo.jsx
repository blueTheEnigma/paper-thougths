'use client';

export default function Logo({ className = "", size = 24 }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Book Spine & Figure */}
      <path 
        d="M25 45C25 41 29 38 34 38C39 38 43 41 43 45V90H25V45Z" 
        fill="currentColor" 
      />
      {/* Left Head */}
      <circle cx="34" cy="24" r="6" fill="currentColor" />
      {/* Left Spine Ribs */}
      <line x1="27" y1="52" x2="41" y2="52" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="27" y1="64" x2="41" y2="64" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="27" y1="76" x2="41" y2="76" stroke="white" strokeWidth="1.5" opacity="0.35" />

      {/* Middle Book Spine & Figure (Raised/Taller) */}
      <path 
        d="M44 35C44 30 49 26 56 26C63 26 68 30 68 35V90H44V35Z" 
        fill="currentColor" 
      />
      {/* Middle Head */}
      <circle cx="56" cy="14" r="7" fill="currentColor" />
      {/* Middle Spine Ribs */}
      <line x1="46" y1="42" x2="66" y2="42" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="46" y1="56" x2="66" y2="56" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="46" y1="70" x2="66" y2="70" stroke="white" strokeWidth="1.5" opacity="0.35" />

      {/* Right Book Spine & Figure */}
      <path 
        d="M69 45C69 41 73 38 78 38C83 38 87 41 87 45V90H69V45Z" 
        fill="currentColor" 
      />
      {/* Right Head */}
      <circle cx="78" cy="24" r="6" fill="currentColor" />
      {/* Right Spine Ribs */}
      <line x1="71" y1="52" x2="85" y2="52" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="71" y1="64" x2="85" y2="64" stroke="white" strokeWidth="1.5" opacity="0.35" />
      <line x1="71" y1="76" x2="85" y2="76" stroke="white" strokeWidth="1.5" opacity="0.35" />
      
      {/* Gold Ribbon Bookmark hanging from center book */}
      <path 
        d="M53 90V96L56 94L59 96V90H53Z" 
        fill="#C96A42" 
      />
    </svg>
  );
}
