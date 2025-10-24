import type { SVGProps } from "react";

export function SmartBiteLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Z" />
        <path d="m9 12 2-10 2 10" />
        <path d="M12 12c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5Z" />
        <path d="m15.5 14.5-3 3-1.5-1.5" />
    </svg>
  );
}


export function ForkAndLeaf(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22V10" />
      <path d="M15 10V5c0-1.66-1.34-3-3-3S9 3.34 9 5v5" />
      <path d="M9 10H7" />
      <path d="M17 10h-2" />
      <path d="M22 10h-2.26c-.45 0-.87.27-1.07.69-.19.4-.1.88.22 1.2L20.4 13.4c.33.33.19.88-.22 1.2l-1.5 1.5c-.41.33-.96.19-1.28-.22l-1.5-1.9c-.32-.41-.87-.55-1.38-.32l-2.07.93c-.51.23-.8.78-.8 1.34V22" />
    </svg>
  );
}

export function Trophy(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V2Z" />
    </svg>
  );
}

export function FirstBadge(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v18" />
      <path d="M16 7l-4-4-4 4" />
      <path d="M12 21l-4-4" />
      <path d="M12 21l4-4" />
    </svg>
  );
}
