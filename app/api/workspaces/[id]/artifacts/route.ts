import { LearningArtifactController } from "@/server/modules/learning-artifact/learning-artifact.controller";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return LearningArtifactController.listArtifacts(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return LearningArtifactController.createArtifact(req, context);
}
