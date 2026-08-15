import { SourceController } from "@/server/modules/source/source.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return SourceController.listSources(req);
}

export async function POST(req: NextRequest) {
  return SourceController.createSource(req);
}

export async function DELETE(req: NextRequest) {
  return SourceController.bulkDeleteSources(req);
}
