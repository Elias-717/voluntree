import Image from "next/image";
import Link from "next/link";

/** The Voluntree logo (DEC-062): dark roots on light backgrounds, the original cream roots on dark ones. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <>
      <Image src="/brand/logo-on-light.png" alt="" width={size} height={size} className="logo-light" />
      <Image src="/brand/logo-on-dark.png" alt="" width={size} height={size} className="logo-dark" />
    </>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold text-lg tracking-tight text-text">
      <LogoMark />
      Voluntree
    </Link>
  );
}

export function PrototypeNote({ className = "" }: { className?: string }) {
  return <p className={`text-xs text-muted ${className}`}>Prototype · not an official AIU system</p>;
}
