"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("generate");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!prompt.trim() && mode !== "canvas") || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });

      if (!res.ok) {
        throw new Error("Failed to create project");
      }

      const { workflowId } = await res.json();
      router.push(`/project/${workflowId}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      alert("Failed to create project. Please ensure your database is running and reachable.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center relative overflow-x-hidden font-sans">
      {/* Hero Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-[128px] -z-10" />
      <div className="absolute top-[20%] right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[128px] -z-10" />
      
      {/* Main Hero Section */}
      <main className="w-full max-w-5xl flex flex-col items-center pt-32 pb-20 px-6 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/70 font-medium">Seedance 2.0 Engine Live</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-center mb-6 bg-gradient-to-br from-white via-white/90 to-white/30 bg-clip-text text-transparent max-w-4xl leading-[1.1]">
          Enterprise AI Motion Graphics
        </h1>
        <p className="text-lg md:text-xl text-white/50 text-center mb-12 max-w-2xl leading-relaxed">
          Transform your product descriptions into cinematic, high-converting video assets in seconds. Powered by the state-of-the-art Seedance video model.
        </p>

        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-3xl relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 via-purple-500 to-sky-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-500 animate-gradient-xy" />
          
          <div className="relative flex flex-col sm:flex-row items-end bg-[#111217] rounded-3xl border border-white/10 p-2 shadow-2xl transition-all focus-within:border-white/20 focus-within:bg-[#16171d]">
            <div className="flex flex-col justify-end w-full sm:w-auto pb-4 pl-4 shrink-0 border-b border-white/5 sm:border-b-0 sm:border-r border-dashed mb-2 sm:mb-0 mr-2">
               <select 
                 className="bg-transparent text-white/60 text-sm outline-none cursor-pointer hover:text-white transition-colors uppercase tracking-wider font-semibold appearance-none pr-4"
                 value={mode}
                 onChange={(e) => setMode(e.target.value)}
                 disabled={isSubmitting}
               >
                 <option value="generate" className="bg-[#111217]">✨ Generate</option>
                 <option value="canvas" className="bg-[#111217]">🎨 Canvas</option>
               </select>
            </div>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "canvas" ? "Optional: Describe to pre-fill the canvas..." : "Describe your motion graphic (e.g. 'An analytics dashboard tracking daily active users')"}
              className="w-full bg-transparent text-white px-4 py-5 sm:px-6 outline-none resize-none min-h-[60px] max-h-[200px] text-lg placeholder:text-white/30"
              rows={1}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={(!prompt.trim() && mode !== "canvas") || isSubmitting}
              className="mb-2 sm:mb-3 mr-2 sm:mr-3 p-3 rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex shrink-0 items-center justify-center self-end sm:self-auto"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-sm text-white/40 flex flex-wrap justify-center items-center gap-4 font-medium tracking-wide">
          <span>Strictly vector graphics</span>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
          <span>Cinematic resolution</span>
          <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
          <span>Clean typography</span>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="w-full max-w-6xl px-6 py-20 z-10 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white/90">Analytics Dashboards</h3>
            <p className="text-white/50 leading-relaxed text-sm">Bring data to life with smooth bezier curve animations, hovering cursor interactions, and expanding UI cards.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white/90">Image-to-Video Workflow</h3>
            <p className="text-white/50 leading-relaxed text-sm">Upload a clean screenshot of your platform and let the Seedance model animate elements, reveals, and transition effects.</p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.04] transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m10 8 6 4-6 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white/90">Native Canvas Editor</h3>
            <p className="text-white/50 leading-relaxed text-sm">Fine-tune your prompt, manage image assets, and preview generated output directly within a node-based interface.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
