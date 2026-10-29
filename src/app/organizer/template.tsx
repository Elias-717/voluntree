// Re-mounts on every navigation in this area, so each new screen rises in (DEC-056). Layouts (tab bar,
// staff navigation) stay put. Motion only when the device allows it (globals.css).

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}
