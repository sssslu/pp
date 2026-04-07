import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const bgmDir = path.join(process.cwd(), "public", "bgm");
  let files: string[] = [];

  try {
    files = fs
      .readdirSync(bgmDir)
      .filter((f) => /\.(mp3|m4a|ogg|wav|flac)$/i.test(f));
  } catch {
    // 폴더가 없거나 읽기 실패 시 빈 배열 반환
  }

  return NextResponse.json({ files });
}
