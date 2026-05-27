import { ComponentChildren } from "preact";

interface Props {
  maxWidth?: "2xl" | "4xl" | "7xl";
  children: ComponentChildren;
}

const widthMap = {
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
};

export default function PageShell({ maxWidth = "2xl", children }: Props) {
  return (
    <div class={`${widthMap[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
      {children}
    </div>
  );
}
