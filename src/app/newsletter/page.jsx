import { Suspense } from "react";
import NewsletterClient from "./NewsletterClient";

export default function NewsletterPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082c33]/80 backdrop-blur-sm">
        <div className="bg-[#FEF5E7] w-[90%] max-w-md p-8 rounded-3xl shadow-2xl border border-[#1E4E68]/20">
          <h3 className="text-2xl font-bold mb-4 text-center text-[#1E4E68]">Verifica Email</h3>
          <p className="text-[#1E4E68] text-center text-lg font-medium">🔄 Caricamento...</p>
        </div>
      </div>
    }>
      <NewsletterClient />
    </Suspense>
  );
}
