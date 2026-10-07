import type { StampType } from "@/lib/stamps";
// Original irregular contours, shared by the wooden face and its ink impression.
const paths: Record<StampType | "freehand", string> = {
  heart:
    "M31 51 C24 44 8 32 10 20 C12 7 25 8 31 20 C36 8 51 9 53 21 C55 34 39 44 31 51 Z",
  star: "M31 7 L37 23 L55 24 L41 35 L46 53 L31 43 L16 54 L20 36 L7 25 L25 23 Z",
  paw: "M18 37 C22 27 38 27 43 39 C53 54 37 55 31 50 C23 57 9 51 18 37 Z M12 21 C5 9 19 6 21 19 C23 29 14 30 12 21 Z M25 15 C20 2 33 1 34 14 C35 24 26 25 25 15 Z M39 18 C38 5 51 8 49 21 C47 31 38 28 39 18 Z",
  cat: "M12 27 L11 8 L25 19 Q31 16 38 20 L51 9 L50 29 C58 55 7 57 12 27 Z M23 30 l1 1 M40 30 l1 1 M29 36 l5 0 l-3 3 Z M31 39 Q26 45 22 40 M31 39 Q36 45 40 40 M9 35 l11 2 M8 42 l12 -2 M43 37 l12 -2 M43 41 l12 3",
  flower:
    "M31 24 C15 2 8 22 22 30 C0 36 15 52 26 40 C26 61 45 55 39 39 C60 45 60 23 41 27 C49 5 28 2 31 24 Z M36 31 C37 40 24 41 25 32 C24 24 36 24 36 31 Z",
  spiral:
    "M31 32 C40 20 49 36 35 41 C18 48 12 23 29 16 C53 5 63 44 39 52 C7 63 -1 19 22 8",
  freehand: "M12 22 L42 10 L17 36 L50 20 L22 49 L50 36 L35 53",
};
export function StampGlyph({
  type,
  seed = 0,
}: {
  type: StampType | "freehand";
  seed?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={paths[type]}
        strokeDasharray={
          seed ? `${40 + (seed % 37)} 1.2 ${17 + (seed % 11)} .8` : undefined
        }
      />
      {seed > 0 && (
        <path
          d={`M${9 + (seed % 9)} 48 l1 .5 M49 ${12 + (seed % 8)} l.5 1`}
          strokeWidth="1.4"
        />
      )}
    </svg>
  );
}
