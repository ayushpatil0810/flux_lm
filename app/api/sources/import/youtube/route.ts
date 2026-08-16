import { SourceController } from "@/server/modules/source/source.controller";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  return SourceController.importYoutubeSource(req);
}
