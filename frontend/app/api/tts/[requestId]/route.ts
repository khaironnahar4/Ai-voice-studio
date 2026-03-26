import { NextResponse }  from "next/server";
import { generateSignedUrl } from "@/lib/storage/r2";
import prisma from "@/lib/auth/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  }

  const request = await prisma.ttsRequest.findUnique({
    where: { id: params.requestId },
    include: {
      audioFile: {
        select: {
          id:                  true,
          storageKey:          true,
          signedUrl:           true,
          signedUrlExpiresAt:  true,
          fileSizeBytes:       true,
          durationSeconds:     true,
          fileFormat:          true,
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  // Ownership check — users can only poll their own requests
  if (request.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Base response shape
  const base = {
    requestId:      request.id,
    status:         request.status,
    charCount:      request.charCount,
    servedFromCache: request.servedFromCache,
    createdAt:      request.createdAt,
    completedAt:    request.completedAt,
  };

  if (request.status !== "completed" || !request.audioFile) {
    return NextResponse.json({
      ...base,
      errorMessage: request.errorMessage ?? null,
    });
  }

  const audio = request.audioFile;

  // Refresh the presigned URL if it has expired or is about to
  let signedUrl   = audio.signedUrl;
  let expiresAt   = audio.signedUrlExpiresAt;
  const threshold = new Date(Date.now() + 60 * 1000); // 1-min buffer

  if (!signedUrl || !expiresAt || expiresAt < threshold) {
    const fresh = await generateSignedUrl(audio.storageKey);
    signedUrl = fresh.url;
    expiresAt = fresh.expiresAt;

    // Persist so the next poll doesn't regenerate
    await prisma.audioFile.update({
      where: { id: audio.id },
      data:  { signedUrl, signedUrlExpiresAt: expiresAt },
    });
  }

  return NextResponse.json({
    ...base,
    audio: {
      id:           audio.id,
      url:          signedUrl,
      urlExpiresAt: expiresAt,
      format:       audio.fileFormat,
      sizeBytes:    audio.fileSizeBytes?.toString(),
      durationSec:  audio.durationSeconds,
    },
  });
}