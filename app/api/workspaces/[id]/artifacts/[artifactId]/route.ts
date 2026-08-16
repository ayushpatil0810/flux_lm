import { LearningArtifactController } from "@/server/modules/learning-artifact/learning-artifact.controller";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; artifactId: string }> },
) {
  return LearningArtifactController.getArtifact(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; artifactId: string }> },
) {
  return LearningArtifactController.deleteArtifact(req, context);
}
