"use client";

import { DragEvent, useRef, useState } from "react";

type CheckResult = {
  label: string;
  detail: string;
  passed: boolean;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const blockedExtensions = [
  "exe",
  "bat",
  "cmd",
  "com",
  "scr",
  "msi",
  "ps1",
  "vbs",
  "vbe",
  "js",
  "jse",
  "wsf",
  "wsh",
  "hta",
];

function getExtension(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function getExpectedMime(extension: string) {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
  };

  return map[extension];
}

async function readFirstBytes(file: File, length = 16) {
  const buffer = await file.slice(0, length).arrayBuffer();
  return new Uint8Array(buffer);
}

function matchesSignature(
  extension: string,
  bytes: Uint8Array
) {
  if (extension === "pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }

  if (extension === "png") {
    const signature = [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ];

    return signature.every(
      (value, index) => bytes[index] === value
    );
  }

  if (
    extension === "jpg" ||
    extension === "jpeg"
  ) {
    return (
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (extension === "gif") {
    const header = String.fromCharCode(
      bytes[0],
      bytes[1],
      bytes[2],
      bytes[3],
      bytes[4],
      bytes[5]
    );

    return (
      header === "GIF87a" ||
      header === "GIF89a"
    );
  }

  return true;
}

export default function SecurityPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>(
    []
  );
  const [score, setScore] = useState<number | null>(
    null
  );
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function scanFile(selectedFile: File) {
    setFile(selectedFile);
    setScanning(true);
    setChecks([]);
    setScore(null);

    const extension = getExtension(
      selectedFile.name
    );

    const results: CheckResult[] = [];

    /* FILE SIZE CHECK */
    const sizePassed =
      selectedFile.size <= MAX_FILE_SIZE;

    results.push({
      label: "File size",
      detail: sizePassed
        ? `${(
            selectedFile.size /
            1024 /
            1024
          ).toFixed(2)} MB`
        : "Maximum allowed size is 50 MB",
      passed: sizePassed,
    });

    /* EXTENSION CHECK */
    const extensionPassed =
      extension.length > 0 &&
      !blockedExtensions.includes(extension);

    results.push({
      label: "File extension",
      detail: extensionPassed
        ? `.${extension} is allowed`
        : `.${
            extension || "unknown"
          } is suspicious`,
      passed: extensionPassed,
    });

    /* FILENAME CHECK */
    const unsafeName =
      /[<>:"/\\|?*\x00-\x1F]/.test(
        selectedFile.name
      );

    results.push({
      label: "Filename",
      detail: unsafeName
        ? "Unsafe characters detected"
        : "Filename looks safe",
      passed: !unsafeName,
    });

    /* MIME CHECK */
    const expectedMime =
      getExpectedMime(extension);

    const mimePassed =
      !expectedMime ||
      selectedFile.type === expectedMime;

    results.push({
      label: "MIME type",
      detail: expectedMime
        ? mimePassed
          ? selectedFile.type ||
            "Detected correctly"
          : `Expected ${expectedMime}`
        : selectedFile.type ||
          "No MIME type provided",
      passed: mimePassed,
    });

    /* FILE SIGNATURE CHECK */
    let signaturePassed = true;

    if (
      [
        "pdf",
        "png",
        "jpg",
        "jpeg",
        "gif",
      ].includes(extension)
    ) {
      const bytes =
        await readFirstBytes(selectedFile);

      signaturePassed =
        matchesSignature(
          extension,
          bytes
        );
    }

    results.push({
      label: "File signature",
      detail: signaturePassed
        ? "Basic file signature looks valid"
        : "File content does not match its extension",
      passed: signaturePassed,
    });

    /* SCORE */
    const passedCount =
      results.filter(
        (item) => item.passed
      ).length;

    const calculatedScore = Math.round(
      (passedCount /
        results.length) *
        100
    );

    setChecks(results);
    setScore(calculatedScore);
    setScanning(false);
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      void scanFile(selectedFile);
    }
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      void scanFile(droppedFile);
    }
  }

  function resetScanner() {
    setFile(null);
    setChecks([]);
    setScore(null);
    setScanning(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* ================= HEADER ================= */}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5 py-4 lg:px-8">

          {/* LEFT - MY DRIVE */}

          <div className="flex justify-start">

            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
            >
              ← My Drive
            </button>

          </div>

          {/* CENTER - SECURITY TITLE */}

          <div className="flex items-center justify-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-2xl shadow-sm ring-1 ring-cyan-100">
              🛡️
            </div>

            <div className="text-left">

              <h1 className="whitespace-nowrap text-xl font-bold text-slate-900">
                Cloud Security Scanner
              </h1>

              <p className="whitespace-nowrap text-sm text-slate-500">
                Check files before storing them
              </p>

            </div>

          </div>

          {/* RIGHT - EMPTY */}

          <div />

        </div>

      </header>

      {/* ================= MAIN CONTENT ================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">

        {/* INTRO */}

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-wider text-cyan-600">
            Secure file analysis
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            Scan before you store.
          </h2>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Check file type, size, filename, MIME
            type and basic file signatures before
            adding a file to your cloud storage.
          </p>

        </div>

        {/* ================= UPLOAD + CHECKS ================= */}

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">

          {/* UPLOAD CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => {
                setDragging(false);
              }}
              onDrop={handleDrop}
              className={`flex min-h-[390px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition ${
                dragging
                  ? "border-cyan-400 bg-cyan-50"
                  : "border-slate-200 bg-slate-50/70 hover:border-cyan-300 hover:bg-cyan-50/40"
              }`}
            >

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-cyan-50 text-4xl shadow-sm ring-1 ring-cyan-100">
                🛡️
              </div>

              <h3 className="mt-5 max-w-full truncate text-xl font-bold text-slate-900">
                {file
                  ? file.name
                  : "Drop your file here"}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {file
                  ? `${(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)} MB • ${
                      file.type ||
                      "Unknown type"
                    }`
                  : "or select a file from your computer"}
              </p>

              <input
                ref={inputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  inputRef.current?.click();
                }}
                className="mt-7 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200 transition hover:scale-[1.02] hover:shadow-xl"
              >
                📁{" "}
                {file
                  ? "Choose Another File"
                  : "Select File"}
              </button>

              <p className="mt-4 text-xs font-medium text-slate-400">
                Maximum file size: 50 MB
              </p>

            </div>

          </div>

          {/* CHECKS CARD */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                🔎
              </div>

              <div>

                <h3 className="font-bold text-slate-900">
                  What we check
                </h3>

                <p className="text-sm text-slate-500">
                  Basic file security analysis
                </p>

              </div>

            </div>

            <div className="mt-5 space-y-3">

              {[
                [
                  "📦",
                  "File size",
                  "Maximum 50 MB",
                ],
                [
                  "📄",
                  "File extension",
                  "Suspicious types checked",
                ],
                [
                  "🏷️",
                  "MIME type",
                  "Type consistency",
                ],
                [
                  "🔤",
                  "Filename",
                  "Unsafe characters",
                ],
                [
                  "🔐",
                  "File signature",
                  "Basic content verification",
                ],
              ].map(
                ([icon, title, detail]) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >

                    <span className="text-lg">
                      {icon}
                    </span>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-bold text-slate-800">
                        {title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {detail}
                      </p>

                    </div>

                    <span className="text-emerald-500">
                      ✓
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* ================= SCANNING ================= */}

        {scanning && (
          <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-center">

            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />

            <p className="mt-3 font-bold text-cyan-800">
              Scanning file...
            </p>

          </div>
        )}

        {/* ================= RESULT ================= */}

        {score !== null && !scanning && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm font-bold uppercase tracking-wider text-cyan-600">
                  Scan result
                </p>

                <h3 className="mt-1 max-w-xl truncate text-2xl font-black text-slate-900">
                  {file?.name}
                </h3>

              </div>

              <div className="flex items-center gap-4">

                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-xl font-black ${
                    score === 100
                      ? "border-emerald-400 bg-emerald-50 text-emerald-600"
                      : score >= 60
                        ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                        : "border-red-400 bg-red-50 text-red-600"
                  }`}
                >
                  {score}
                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    {score === 100
                      ? "Looks safe"
                      : score >= 60
                        ? "Review required"
                        : "Security warning"}
                  </p>

                  <p className="text-sm text-slate-500">
                    Basic validation score
                  </p>

                </div>

              </div>

            </div>

            {/* CHECK RESULTS */}

            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">

              {checks.map((check) => (
                <div
                  key={check.label}
                  className={`rounded-xl border p-4 ${
                    check.passed
                      ? "border-emerald-100 bg-emerald-50/60"
                      : "border-red-100 bg-red-50/60"
                  }`}
                >

                  <div className="flex items-center justify-between gap-2">

                    <p className="text-sm font-bold text-slate-800">
                      {check.label}
                    </p>

                    <span
                      className={
                        check.passed
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {check.passed
                        ? "✓"
                        : "!"}
                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {check.detail}
                  </p>

                </div>
              ))}

            </div>

            {/* SCAN ANOTHER */}

            <div className="mt-6 flex flex-wrap gap-3">

              <button
                type="button"
                onClick={resetScanner}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Scan Another File
              </button>

            </div>

          </div>
        )}

        {/* ================= SECURITY NOTE ================= */}

        <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">

          <div className="flex gap-3">

            <span className="text-xl">
              ℹ️
            </span>

            <div>

              <p className="font-bold text-slate-800">
                Security note
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                This scanner performs basic local
                file validation. It checks file size,
                extension, filename, MIME type and
                known file signatures. It is not a
                full antivirus or malware scanner.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}