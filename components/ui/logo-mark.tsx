// CineAmore logo mark — the stylised heart symbol from the official SVG
// viewBox is cropped to the glyph's bounding box (calculated from the transform-space path)
export function LogoMark({
  size = 32,
  color = "#FF375F",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="1263 118 248 248"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(0,461) scale(0.1,-0.1)" fill={color} stroke="none">
        <path fill={color} d="M13290 3249 c-105 -29 -161 -64 -267 -168 -103 -102 -139 -159 -179
-281 -23 -72 -27 -103 -28 -205 -2 -244 79 -469 254 -704 66 -88 262 -289 347
-354 101 -77 259 -176 350 -219 74 -35 98 -42 153 -42 59 -1 75 4 184 57 206
99 329 191 528 395 194 199 302 370 364 580 35 117 44 319 20 437 -26 128 -94
254 -186 345 -124 124 -227 168 -412 177 -178 9 -291 -19 -412 -103 -36 -24
-75 -44 -88 -44 -13 0 -52 23 -88 50 -94 72 -163 92 -330 96 -113 3 -147 1
-210 -17z m56 -251 c61 -42 99 -111 86 -160 -13 -50 -65 -85 -145 -98 -90 -14
-129 -6 -171 37 -41 43 -50 79 -31 133 30 84 76 119 161 120 42 0 61 -6 100
-32z" />
      </g>
    </svg>
  );
}
