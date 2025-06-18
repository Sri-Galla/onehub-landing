// src/pages/Home.tsx
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden font-sans">
      <main className="flex-grow overflow-hidden">
        <Hero />
      </main>

      {/* Footer shows *after* scroll */}
      <Footer />
    </div>
  );
}
