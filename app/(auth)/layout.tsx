export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <a href="/" className="mb-8 text-3xl font-black text-teal tracking-tight">
        Grubly
      </a>
      {children}
    </div>
  );
}
