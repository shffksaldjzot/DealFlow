export default function EventPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-gray-800">DealFlow</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
