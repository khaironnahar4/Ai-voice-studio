import { NextResponse }  from "next/server"
import { getSession }    from "@/lib/auth/session"
import prisma            from "@/lib/auth/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  const request = await prisma.ttsRequest.findUnique({
    where:  { id: params.requestId },
    select: { userId: true, audioFile: { select: { id: true } } },
  })

  if (!request || request.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  // Soft-delete audio file — S3 cleanup job handles physical deletion after 30 days
  if (request.audioFile) {
    await prisma.audioFile.update({
      where: { id: request.audioFile.id },
      data:  { deletedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}