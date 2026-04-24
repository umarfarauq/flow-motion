import Link from "next/link";
import { getRenderJob } from "@/lib/db/workflows";

export default async function RenderResultPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getRenderJob(jobId);

  if (!job) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-2xl border border-black p-8">
          <div className="text-[11px] uppercase tracking-[0.24em]">Render</div>
          <h1 className="mt-3 text-3xl font-semibold">Result not found</h1>
          <Link href="/" className="mt-8 inline-flex border border-black px-4 py-3 text-sm">
            Return to canvas
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen grid-cols-[1fr_420px]">
      <section className="flex items-center justify-center border-r border-black p-10">
        <div className="aspect-video w-full max-w-5xl border border-black bg-white p-8">
          {job.outputUrl ? (
            <video
              src={job.outputUrl}
              controls
              className="h-full w-full border border-black bg-black object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center border border-black text-center">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em]">Render Preview</div>
                <div className="mt-4 text-4xl font-semibold">FlowMotion Output</div>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-6">
                  Your video is still processing or did not finish writing yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="p-8">
        <div className="border border-black p-6">
          <div className="text-[11px] uppercase tracking-[0.24em]">Job Status</div>
          <div className="mt-3 text-2xl font-semibold">{job.status}</div>
          <div className="mt-6 text-[11px] uppercase tracking-[0.24em]">Job ID</div>
          <div className="mt-2 break-all text-sm">{job.id}</div>
          <div className="mt-6 text-[11px] uppercase tracking-[0.24em]">Payload</div>
          <pre className="mt-2 max-h-[480px] overflow-auto border border-black p-4 text-xs leading-5">
            {JSON.stringify(job.payload, null, 2)}
          </pre>
          <Link href="/" className="mt-6 inline-flex border border-black px-4 py-3 text-sm">
            Back to canvas
          </Link>
        </div>
      </aside>
    </main>
  );
}
