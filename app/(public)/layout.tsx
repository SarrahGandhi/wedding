import { FloatingNav } from "../components/FloatingNav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FloatingNav />
      <main className="flex-1 pt-24 flex flex-col">{children}</main>
    </>
  );
}
