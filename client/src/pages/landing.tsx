import React, { useState } from "react";

const HERO_IMG = "https://unsplash.com/photos/47uULlB3rrE/download?force=true&w=1600"; // gold ring macro (Unsplash). Replace with local file.
const PRODUCT_1 = "https://unsplash.com/photos/FfkonAvnTss/download?force=true&w=1200"; // two rings on white
const PRODUCT_2 = "https://www.pexels.com/photo/hanging-gold-colored-pendant-with-necklace-39239/download/"; // pendant
const PRODUCT_3 = "https://www.pexels.com/photo/close-up-shot-of-an-insect-4166452/download/"; // gold jewelry close-up

export default function Landing() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    // hook to your backend / marketing list
    console.log("join", { name, email });
    setName("");
    setEmail("");
    alert("Thanks — we'll be in touch!");
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white antialiased">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-lg font-medium tracking-wide">VERKOVE</div>
        <nav className="flex gap-8 text-sm">
          <a className="hover:underline" href="#collections">Collections</a>
          <a className="hover:underline" href="#tech">Technology</a>
          <a className="hover:underline" href="#about">About</a>
          <a className="hover:underline" href="#contact">Contact</a>
        </nav>
      </header>

      {/* HERO */}
      <main className="relative overflow-hidden">
        {/* left content + right image grid */}
        <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12 lg:py-20">
          {/* left copy */}
          <div className="space-y-6 lg:pr-8">
            <p className="text-sm uppercase text-amber-600 tracking-widest">Precision craft</p>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Advanced casting. Finished to museum standard.
            </h1>

            <p className="text-gray-600 max-w-md">
              We pioneer pressure-over-vacuum casting for flawless density, zero porosity and micro-detail across 9k–22k gold and 925 silver — handcrafted in Kashmir.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#collections"
                className="inline-flex items-center px-6 py-3 border border-amber-700 text-amber-800 hover:bg-amber-800 hover:text-white transition rounded"
              >
                Explore collection
              </a>
              <a href="#tech" className="text-sm text-gray-600 hover:underline">Learn about the tech →</a>
            </div>

            {/* Specs band (small) */}
            <div className="mt-6">
              <div className="inline-flex items-center bg-black text-white px-4 py-3 rounded-md shadow-md">
                <div className="text-xs uppercase tracking-wide mr-4">DC-01</div>
                <div className="font-semibold mr-6">$1,200</div>
                <button className="bg-amber-500 px-4 py-2 rounded text-sm font-medium">Add</button>
              </div>
            </div>
          </div>

          {/* right hero image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="w-[380px] md:w-[520px] lg:w-[640px] aspect-[5/4] bg-white rounded-sm drop-shadow-2xl overflow-hidden flex items-center justify-center">
              <img
                src={HERO_IMG}
                alt="Gold ring macro"
                className="object-cover w-full h-full"
              />
            </div>

            {/* vertical specs (absolute, left) */}
            <div className="hidden lg:flex flex-col absolute left-8 top-32 text-sm">
              <div className="mb-6">
                <div className="text-xs text-gray-500">Weight</div>
                <div className="font-semibold">7.2g</div>
              </div>
              <div className="mb-6">
                <div className="text-xs text-gray-500">Metal density</div>
                <div className="font-semibold">≥ 99.9%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Porosity</div>
                <div className="font-semibold">Zero</div>
              </div>
            </div>
          </div>
        </section>

        {/* thin separator */}
        <div className="border-t border-gray-100" />
      </main>

      {/* Product strip */}
      <section id="collections" className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 flex items-center justify-center">
            <img src={PRODUCT_1} alt="product 1" className="h-28 object-contain" />
          </div>
          <div className="bg-gray-50 p-4 flex items-center justify-center">
            <img src={PRODUCT_2} alt="product 2" className="h-28 object-contain" />
          </div>
          <div className="bg-gray-50 p-4 flex items-center justify-center">
            <img src={PRODUCT_3} alt="product 3" className="h-28 object-contain" />
          </div>
          <div className="bg-gray-50 p-4 flex items-center justify-center text-gray-500">
            More images →
          </div>
        </div>
      </section>

      {/* TECH SPECS BAND */}
      <section id="tech" className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold">Pressure-Over-Vacuum Casting™</h2>
            <p className="mt-4 text-gray-600 max-w-lg">
              Our process combines vacuum control and pressurised metal feed to eliminate micro-voids while preserving the finest detail. The result: higher density, zero porosity and unmatched reproducibility.
            </p>

            <ul className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <li className="py-2 border-b border-gray-100">
                <div className="text-gray-500">Karats</div>
                <div className="font-medium">9k — 22k</div>
              </li>
              <li className="py-2 border-b border-gray-100">
                <div className="text-gray-500">Sterling</div>
                <div className="font-medium">925</div>
              </li>
              <li className="py-2 border-b border-gray-100">
                <div className="text-gray-500">Density</div>
                <div className="font-medium">&gt; 19.2 g/cm³ (Au equiv.)</div>

              </li>
              <li className="py-2 border-b border-gray-100">
                <div className="text-gray-500">Porosity</div>
                <div className="font-medium">Zero (lab verified)</div>
              </li>
            </ul>

            <div className="mt-6">
              <a className="inline-block px-5 py-3 border border-black rounded text-sm hover:bg-black hover:text-white transition" href="#about">
                Explore the tech
              </a>
            </div>
          </div>

          <div className="bg-black text-white rounded-lg p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.pexels.com/photos/4166452/pexels-photo-4166452.jpeg')] bg-cover bg-center"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold">Lab precision. Kashmir craft.</h3>
              <p className="mt-4 text-gray-200">
                Built and operated in Srinagar — combining advanced metallurgical equipment with artisan finishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAILING CTA */}
      <section id="contact" className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-100 rounded-lg p-8 shadow">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h4 className="text-2xl font-bold">Join our mailing list</h4>
              <p className="text-gray-600 mt-2">Get early access to new drops and behind-the-scenes tech notes.</p>
            </div>

            <form onSubmit={handleJoin} className="flex gap-3 w-full md:w-auto">
              <input
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Name"
                className="px-4 py-3 border border-gray-200 rounded w-full md:w-48"
              />
              <input
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="Email address"
                type="email"
                className="px-4 py-3 border border-gray-200 rounded w-full md:w-64"
              />
              <button className="px-5 py-3 bg-amber-600 text-white rounded">Join</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="text-sm">VERKOVE · Kashmir</div>
          <div className="text-sm text-gray-500">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
