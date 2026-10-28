// Student screens are mobile-first: one centred phone-width column.

// Signed-in pages read the session cookie, so they render per request.
export const instant = false;

export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return <div className="mx-auto flex min-h-svh w-full max-w-md flex-col">{children}</div>;
}
