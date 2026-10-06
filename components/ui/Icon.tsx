import type { SVGProps } from "react";
export type IconName =
  | "back"
  | "pen"
  | "stamp"
  | "eraser"
  | "undo"
  | "trash"
  | "shuffle"
  | "copy"
  | "arrow"
  | "check"
  | "close"
  | "star"
  | "warning"
  | "heart"
  | "home";
const paths: Record<IconName, string> = {
  back: "m14 6-6 6 6 6M8 12h13",
  pen: "m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-4-4L5 15z",
  stamp: "M9 14V8a3 3 0 0 1 6 0v6m-8 0h10l3 5H4zM5 22h14",
  eraser: "m13 3 8 8-10 10H6l-5-5L13 3zm-7 9 8 8M11 21h11",
  undo: "M4 10h10a6 6 0 0 1 0 12M4 10l6-6M4 10l6 6",
  trash: "M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7",
  shuffle:
    "M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4",
  copy: "M8 8h12v13H8zM16 8V3H3v13h5",
  arrow: "M3 12h18m-7-7 7 7-7 7",
  check: "m4 12 5 5L20 6",
  close: "m18 6-12 12M6 6l12 12",
  star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1z",
  warning: "m12 3 10 18H2L12 3zm0 5v6m0 3h.01",
  heart: "M12 21 3 12a5 5 0 0 1 9-7 5 5 0 0 1 9 7z",
  home: "m3 10 9-7 9 7M5 9v12h14V9m-10 12v-8h6v8",
};
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
