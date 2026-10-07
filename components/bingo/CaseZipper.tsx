import { useId } from "react";

/** Two brass tooth rails stitched into the fabric; scale the route, not the metal strokes. */
export function CaseZipper({ open }: { open: boolean }) {
  const id = useId();
  const route = open
    ? "M35 12 Q180 5 325 12 Q348 14 348 40 L348 387 Q350 426 320 428 L38 428 Q10 426 12 395 L12 42 Q10 15 35 12 Z"
    : "M35 12 Q180 5 325 12 Q348 14 348 36 L348 85 Q348 108 320 108 L38 108 Q12 108 12 85 L12 36 Q10 15 35 12 Z";
  return (
    <svg
      className="case-zipper"
      viewBox={open ? "0 0 360 440" : "0 0 360 120"}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor="#523a1c" />
          <stop offset=".35" stopColor="#e5bd6a" />
          <stop offset=".6" stopColor="#a57432" />
          <stop offset=".8" stopColor="#f5d38a" />
          <stop offset="1" stopColor="#775020" />
        </linearGradient>
      </defs>
      <path
        d={route}
        fill="none"
        stroke="#120f0a"
        strokeWidth="28"
        strokeDasharray="3.5 4 4.2 3.2"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={route}
        fill="none"
        stroke="#b4986a"
        strokeWidth="26"
        strokeDasharray="2.5 5 3.2 4.2"
        vectorEffect="non-scaling-stroke"
        opacity=".8"
      />
      <path
        d={route}
        fill="none"
        stroke="#171b18"
        strokeWidth="21"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={route}
        fill="none"
        stroke="#64604a"
        strokeWidth="18"
        vectorEffect="non-scaling-stroke"
        opacity=".55"
      />
      <path
        d={route}
        fill="none"
        stroke="#211c13"
        strokeWidth="15"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={route}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="13"
        strokeDasharray="3 4"
        strokeLinecap="butt"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={route}
        fill="none"
        stroke="#f2cc82"
        strokeWidth="11"
        strokeDasharray="1.1 5.9"
        strokeDashoffset="-.7"
        vectorEffect="non-scaling-stroke"
        opacity=".85"
      />
      <path
        d={route}
        fill="none"
        stroke="#2b2011"
        strokeWidth={open ? "3.5" : "1.5"}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function ZipperPull() {
  const id = useId();
  return (
    <svg viewBox="0 0 50 76" aria-hidden="true" className="pull-art">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#edc77d" />
          <stop offset=".4" stopColor="#a57837" />
          <stop offset=".7" stopColor="#65431d" />
          <stop offset="1" stopColor="#e0b364" />
        </linearGradient>
      </defs>
      <path
        d="M16 3 Q25 -1 33 3 L34 16 Q26 21 15 16 Z"
        fill={`url(#${id})`}
        stroke="#4e351b"
        strokeWidth="1.5"
      />
      <path
        d="M21 8 Q13 18 20 25 Q32 32 33 19 Q34 12 27 8"
        fill="none"
        stroke="#251c11"
        strokeWidth="6"
      />
      <path
        d="M21 8 Q13 18 20 25 Q32 32 33 19 Q34 12 27 8"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="3"
      />
      <path
        d="M18 22 Q24 18 31 24 L40 58 Q43 70 27 72 Q12 72 12 61 Z"
        fill="#784322"
        stroke="#321f16"
        strokeWidth="2"
      />
      <path
        d="M20 26 Q24 23 29 27 L36 58 Q40 67 27 68 Q17 67 17 60 Z"
        fill="none"
        stroke="#c9a073"
        strokeWidth="1.2"
        strokeDasharray="2.2 2.6"
      />
      <path
        d="M26 48 C18 40 17 53 28 59 C38 49 33 42 26 48 Z"
        fill="#b57951"
        stroke="#442619"
        strokeWidth="1"
      />
      <circle cx="25" cy="29" r="2.4" fill={`url(#${id})`} stroke="#432d18" />
      <path d="M19 36 l1 9 M32 58 l2 3" stroke="#a16841" strokeWidth="1" />
    </svg>
  );
}
