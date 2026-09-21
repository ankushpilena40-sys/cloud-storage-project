import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "../../../../lib/supabase/server";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function getErrorCode(message: string) {
  if (message.includes("LINK_NOT_FOUND")) {
    return "LINK_NOT_FOUND";
  }

  if (message.includes("LINK_EXPIRED")) {
    return "LINK_EXPIRED";
  }

  if (message.includes("PASSWORD_REQUIRED")) {
    return "PASSWORD_REQUIRED";
  }

  if (message.includes("INVALID_PASSWORD")) {
    return "INVALID_PASSWORD";
  }

  return "UNKNOWN_ERROR";
}

async function getPublicFile(
  token: string,
  password: string | null
) {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc(
    "resolve_public_link",
    {
      p_token: token,
      p_password: password,
    }
  );

  if (error) {
    console.error("Resolve public link error:", error);

    return {
      success: false as const,
      errorCode: getErrorCode(error.message || ""),
      errorMessage:
        error.message || "Unable to resolve link.",
    };
  }

  const link = Array.isArray(data) ? data[0] : data;

  if (!link) {
    return {
      success: false as const,
      errorCode: "LINK_NOT_FOUND",
      errorMessage: "Share link does not exist.",
    };
  }

  if (link.resource_type !== "file") {
    return {
      success: false as const,
      errorCode: "UNSUPPORTED_RESOURCE",
      errorMessage:
        "This public link is not a file link.",
    };
  }

  const { data: file, error: fileError } =
    await supabase
      .from("files")
      .select(
        "id, name, storage_key, mime_type, size_bytes"
      )
      .eq("id", link.resource_id)
      .eq("is_deleted", false)
      .single();

  if (fileError || !file) {
    console.error(
      "Public file lookup error:",
      fileError
    );

    return {
      success: false as const,
      errorCode: "FILE_NOT_FOUND",
      errorMessage:
        "The shared file could not be found.",
    };
  }

  const { data: signedData, error: signedError } =
    await supabase.storage
      .from("drive")
      .createSignedUrl(
        file.storage_key,
        60
      );

  if (
    signedError ||
    !signedData?.signedUrl
  ) {
    console.error(
      "Create signed URL error:",
      signedError
    );

    return {
      success: false as const,
      errorCode: "DOWNLOAD_URL_FAILED",
      errorMessage:
        "Could not create download URL.",
    };
  }

  return {
    success: true as const,

    link: {
      id: link.link_id,
      resourceType: link.resource_type,
      resourceId: link.resource_id,
      role: link.role,
      expiresAt: link.expires_at,
    },

    file: {
      id: file.id,
      name: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
    },

    signedUrl: signedData.signedUrl,
  };
}

/*
  Converts the Supabase signed URL into a real
  browser download response.
*/
async function downloadPublicFile(
  signedUrl: string,
  fileName: string,
  mimeType: string | null
) {
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(
      `File download failed (${response.status})`
    );
  }

  const fileBuffer = await response.arrayBuffer();

  const safeFileName = fileName
    .replace(/[\r\n"]/g, "_");

  const encodedFileName =
    encodeURIComponent(safeFileName);

  return new Response(fileBuffer, {
    status: 200,

    headers: {
      "Content-Type":
        mimeType ||
        "application/octet-stream",

      "Content-Disposition":
        `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,

      "Content-Length":
        String(fileBuffer.byteLength),

      "Cache-Control":
        "private, no-store, max-age=0",

      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

/*
  GET

  Normal:
  /api/public-share/abc123

  Download:
  /api/public-share/abc123?download=1
*/
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        {
          error: "INVALID_LINK",
          message: "Invalid share link.",
        },
        { status: 400 }
      );
    }

    const result = await getPublicFile(
      token,
      null
    );

    if (!result.success) {
      switch (result.errorCode) {
        case "LINK_NOT_FOUND":
          return NextResponse.json(
            {
              error: "LINK_NOT_FOUND",
              message:
                "This share link does not exist.",
            },
            { status: 404 }
          );

        case "LINK_EXPIRED":
          return NextResponse.json(
            {
              error: "LINK_EXPIRED",
              message:
                "This share link has expired.",
            },
            { status: 410 }
          );

        case "PASSWORD_REQUIRED":
          return NextResponse.json(
            {
              error: "PASSWORD_REQUIRED",
              passwordRequired: true,
              message:
                "This share link is password protected.",
            },
            { status: 401 }
          );

        case "UNSUPPORTED_RESOURCE":
          return NextResponse.json(
            {
              error: "UNSUPPORTED_RESOURCE",
              message:
                "This public link is not a file link.",
            },
            { status: 400 }
          );

        case "FILE_NOT_FOUND":
          return NextResponse.json(
            {
              error: "FILE_NOT_FOUND",
              message:
                "The shared file could not be found.",
            },
            { status: 404 }
          );

        default:
          return NextResponse.json(
            {
              error: "UNABLE_TO_RESOLVE_LINK",
              message:
                result.errorMessage ||
                "Unable to open this share link.",
            },
            { status: 500 }
          );
      }
    }

    /*
      If ?download=1 is present,
      return the actual file as an attachment.
    */
    if (
      request.nextUrl.searchParams.get(
        "download"
      ) === "1"
    ) {
      try {
        return await downloadPublicFile(
          result.signedUrl,
          result.file.name,
          result.file.mimeType
        );
      } catch (error) {
        console.error(
          "Public file download error:",
          error
        );

        return NextResponse.json(
          {
            error: "DOWNLOAD_FAILED",
            message:
              "Could not download the file.",
          },
          { status: 500 }
        );
      }
    }

    /*
      Normal share-page response.
    */
    return NextResponse.json({
      success: true,
      link: result.link,
      file: result.file,
      signedUrl: result.signedUrl,
    });
  } catch (error) {
    console.error(
      "GET public share route error:",
      error
    );

    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message:
          "Something went wrong while opening the share link.",
      },
      { status: 500 }
    );
  }
}

/*
  POST

  Used for password-protected public links.

  Normal:
  POST /api/public-share/abc123

  Download:
  POST /api/public-share/abc123?download=1

  Body:
  {
    "password": "your-password"
  }
*/
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        {
          error: "INVALID_LINK",
          message: "Invalid share link.",
        },
        { status: 400 }
      );
    }

    let body: {
      password?: string;
    } = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!password.trim()) {
      return NextResponse.json(
        {
          error: "PASSWORD_REQUIRED",
          passwordRequired: true,
          message:
            "Please enter the password.",
        },
        { status: 401 }
      );
    }

    const result = await getPublicFile(
      token,
      password
    );

    if (!result.success) {
      switch (result.errorCode) {
        case "LINK_NOT_FOUND":
          return NextResponse.json(
            {
              error: "LINK_NOT_FOUND",
              message:
                "This share link does not exist.",
            },
            { status: 404 }
          );

        case "LINK_EXPIRED":
          return NextResponse.json(
            {
              error: "LINK_EXPIRED",
              message:
                "This share link has expired.",
            },
            { status: 410 }
          );

        case "PASSWORD_REQUIRED":
          return NextResponse.json(
            {
              error: "PASSWORD_REQUIRED",
              passwordRequired: true,
              message:
                "Please enter the password.",
            },
            { status: 401 }
          );

        case "INVALID_PASSWORD":
          return NextResponse.json(
            {
              error: "INVALID_PASSWORD",
              passwordRequired: true,
              message:
                "Incorrect password.",
            },
            { status: 401 }
          );

        case "UNSUPPORTED_RESOURCE":
          return NextResponse.json(
            {
              error: "UNSUPPORTED_RESOURCE",
              message:
                "This public link is not a file link.",
            },
            { status: 400 }
          );

        case "FILE_NOT_FOUND":
          return NextResponse.json(
            {
              error: "FILE_NOT_FOUND",
              message:
                "The shared file could not be found.",
            },
            { status: 404 }
          );

        default:
          return NextResponse.json(
            {
              error: "UNABLE_TO_RESOLVE_LINK",
              message:
                result.errorMessage ||
                "Unable to open this share link.",
            },
            { status: 500 }
          );
      }
    }

    /*
      Password is valid and ?download=1 was requested.
    */
    if (
      request.nextUrl.searchParams.get(
        "download"
      ) === "1"
    ) {
      try {
        return await downloadPublicFile(
          result.signedUrl,
          result.file.name,
          result.file.mimeType
        );
      } catch (error) {
        console.error(
          "Protected public file download error:",
          error
        );

        return NextResponse.json(
          {
            error: "DOWNLOAD_FAILED",
            message:
              "Could not download the file.",
          },
          { status: 500 }
        );
      }
    }

    /*
      Normal password verification response.
    */
    return NextResponse.json({
      success: true,
      link: result.link,
      file: result.file,
      signedUrl: result.signedUrl,
    });
  } catch (error) {
    console.error(
      "POST public share route error:",
      error
    );

    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message:
          "Something went wrong while opening the share link.",
      },
      { status: 500 }
    );
  }
}