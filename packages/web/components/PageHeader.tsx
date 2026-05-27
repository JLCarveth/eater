import { ComponentChildren } from "preact";
import BackLink from "./BackLink.tsx";

interface Props {
  title: string;
  titleSuffix?: ComponentChildren;
  subtitle?: ComponentChildren;
  titleSize?: "2xl" | "3xl";
  back?: { href: string; label: string };
  actions?: ComponentChildren;
  spacing?: "mb-6" | "mb-8";
}

const titleSizeMap = { "2xl": "text-2xl", "3xl": "text-3xl" };

export default function PageHeader({
  title,
  titleSuffix,
  subtitle,
  titleSize = "2xl",
  back,
  actions,
  spacing = "mb-8",
}: Props) {
  const titleClass = `${titleSizeMap[titleSize]} font-bold text-gray-900`;

  const titleEl = titleSuffix ? (
    <div class={`flex items-center gap-3${back ? " mt-2" : ""}`}>
      <h1 class={titleClass}>{title}</h1>
      {titleSuffix}
    </div>
  ) : (
    <h1 class={`${titleClass}${back ? " mt-2" : ""}`}>{title}</h1>
  );

  const subtitleEl = subtitle && (
    <p class={`text-gray-600${titleSize === "3xl" ? " mt-1" : ""}`}>{subtitle}</p>
  );

  if (actions) {
    return (
      <div class={`flex justify-between items-center ${spacing}`}>
        <div>
          {back && <BackLink href={back.href}>{back.label}</BackLink>}
          {titleEl}
          {subtitleEl}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div class={spacing}>
      {back && <BackLink href={back.href}>{back.label}</BackLink>}
      {titleEl}
      {subtitleEl}
    </div>
  );
}
