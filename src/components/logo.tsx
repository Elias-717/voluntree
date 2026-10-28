import Link from "next/link";
import { Plant } from "@phosphor-icons/react/ssr";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 font-semibold text-lg tracking-tight text-text">
      <span className="grid size-9 place-items-center rounded-[10px] bg-primary text-on-primary">
        <Plant size={20} weight="fill" aria-hidden />
      </span>
      Voluntree
    </Link>
  );
}

export function PrototypeNote({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-muted ${className}`}>Prototype · not an official AIU system</p>;
}
