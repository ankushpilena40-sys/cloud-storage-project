"use client";

import { useEffect, useState } from "react";

type LinkData = {
  id: string;
  resourceType: string;
  resourceId: string;
  role: string;
  expiresAt: string | null;
};

type CloudFile = {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export default function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");

  const [linkData, setLinkData] =
    useState<LinkData | null>(null);

  const [file, setFile] =
    useState<CloudFile | null>(null);

  const [signedUrl, setSignedUrl] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [passwordRequired, setPasswordRequired] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadToken() {
      const resolved = await params;

      const publicToken =
        resolved.token;

      setToken(publicToken);

      await resolveLink(
        publicToken,
        ""
      );
    }

    loadToken();
  }, []);

  async function resolveLink(
    publicToken: string,
    enteredPassword: string
  ) {
    setError("");
    setChecking(true);

    if (!publicToken) {
      setError("Invalid share link.");
      setLoading(false);
      setChecking(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/public-share/${encodeURIComponent(
          publicToken
        )}`,
        {
          method:
            enteredPassword.trim()
              ? "POST"
              : "GET",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            enteredPassword.trim()
              ? JSON.stringify({
                  password:
                    enteredPassword,
                })
              : undefined,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          result.error ===
          "PASSWORD_REQUIRED"
        ) {
          setPasswordRequired(true);
          setError(
            "This file is password protected."
          );
        } else if (
          result.error ===
          "INVALID_PASSWORD"
        ) {
          setPasswordRequired(true);
          setError(
            "Incorrect password."
          );
        } else if (
          result.error ===
          "LINK_EXPIRED"
        ) {
          setError(
            "This share link has expired."
          );
        } else if (
          result.error ===
          "LINK_NOT_FOUND"
        ) {
          setError(
            "This share link does not exist."
          );
        } else if (
          result.error ===
          "FILE_NOT_FOUND"
        ) {
          setError(
            "The shared file could not be found."
          );
        } else {
          setError(
            result.message ||
              "Unable to open this share link."
          );
        }

        setFile(null);
        setSignedUrl("");
        setLinkData(null);
        setLoading(false);
        setChecking(false);
        return;
      }

      setLinkData(result.link);
      setFile(result.file);
      setSignedUrl(
        result.signedUrl
      );
      setPasswordRequired(false);
      setError("");
    } catch (requestError) {
      console.error(
        "Public share request error:",
        requestError
      );

      setError(
        "Unable to connect to the share service."
      );
    }

    setLoading(false);
    setChecking(false);
  }

  async function submitPassword() {
    if (!password.trim()) {
      setError(
        "Please enter the password."
      );
      return;
    }

    await resolveLink(
      token,
      password
    );
  }

  function downloadFile() {
    if (!signedUrl || !file) {
      return;
    }

    setDownloading(true);

    const link =
      document.createElement("a");

    link.href = signedUrl;
    link.download = file.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      setDownloading(false);
    }, 1000);
  }

  function formatFileSize(
    bytes: number | null
  ) {
    if (bytes === null) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    if (
      bytes <
      1024 * 1024 * 1024
    ) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 *
        1024 *
        1024)
    ).toFixed(1)} GB`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <div className="text-4xl">
            ⏳
          </div>

          <h1 className="mt-4 text-xl font-bold">
            Opening shared file...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  if (
    passwordRequired &&
    !file
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">

          <div className="text-center">
            <div className="text-5xl">
              🔒
            </div>

            <h1 className="mt-4 text-2xl font-bold">
              Password required
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Enter the password to open this shared file.
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter"
              ) {
                submitPassword();
              }
            }}
            placeholder="Enter password"
            autoFocus
            className="mt-6 w-full rounded-lg border px-4 py-3 outline-none focus:ring-2"
          />

          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            onClick={
              submitPassword
            }
            disabled={checking}
            className="mt-4 w-full rounded-lg bg-black px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking
              ? "Checking..."
              : "Open File"}
          </button>
        </div>
      </main>
    );
  }

  if (
    error &&
    !file
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">

          <div className="text-5xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-2xl font-bold">
            Unable to open file
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-lg bg-black px-5 py-3 text-sm text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow">

        <div className="text-center">
          <div className="text-6xl">
            📄
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-gray-400">
            Shared file
          </p>

          <h1 className="mt-2 break-words text-2xl font-bold">
            {file?.name}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {formatFileSize(
              file?.sizeBytes ?? null
            )}
          </p>
        </div>

        {linkData?.expiresAt && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-800">
            This link expires on{" "}
            {new Date(
              linkData.expiresAt
            ).toLocaleString()}
          </div>
        )}

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={
            downloadFile
          }
          disabled={
            downloading ||
            !signedUrl
          }
          className="mt-6 w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? "Opening..."
            : "⬇️ Download File"}
        </button>

        <p className="mt-5 text-center text-xs text-gray-400">
          Powered by Cloud Storage
        </p>
      </div>
    </main>
  );
}
