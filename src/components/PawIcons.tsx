import type { SVGProps } from 'react';

// A realistic-ish cat paw print icon.
export function PawPrint(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {/* main pad */}
      <ellipse cx="12" cy="15.5" rx="5.2" ry="4.3" />
      {/* toes */}
      <ellipse cx="6.5" cy="9.5" rx="2" ry="2.6" />
      <ellipse cx="10.5" cy="7" rx="1.9" ry="2.5" />
      <ellipse cx="13.6" cy="7" rx="1.9" ry="2.5" />
      <ellipse cx="17.5" cy="9.5" rx="2" ry="2.6" />
    </svg>
  );
}

// A simple cat head silhouette.
export function CatHead(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M5 4l2.2 3.2C6.4 8 5.9 8.9 5.6 9.9L3 9v2.5l2.4.7c-.1.6-.2 1.2-.2 1.8 0 .5.1 1 .2 1.6L3 16.3V19l2.8-.6c.8 1.6 2.1 2.9 3.8 3.6L12 21l2.4 1c1.7-.7 3-2 3.8-3.6L21 19v-2.7l-2.4-.7c.1-.5.2-1.1.2-1.6 0-.6-.1-1.2-.2-1.8L21 11V9l-2.6.9c-.3-1-.8-1.9-1.6-2.7L19 4l-3.4 1.6C14.4 5.2 13.2 5 12 5s-2.4.2-3.6.6L5 4z" />
      <circle cx="9.5" cy="12" r="1.1" fill="#fff" />
      <circle cx="14.5" cy="12" r="1.1" fill="#fff" />
    </svg>
  );
}
