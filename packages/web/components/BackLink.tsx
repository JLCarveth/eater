import { ComponentChildren } from "preact";

interface Props {
  href: string;
  children: ComponentChildren;
}

export default function BackLink({ href, children }: Props) {
  return (
    <a href={href} class="text-primary-600 hover:text-primary-500 text-sm">
      &larr; {children}
    </a>
  );
}
