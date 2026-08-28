import { extractFileText } from "@/lib/parse-files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing file" }, { status: 400 });
    }

    const text = await extractFileText(file);
    if (!text) {
      return Response.json(
        { error: `No extractable text in ${file.name}` },
        { status: 422 },
      );
    }

    return Response.json({ name: file.name, text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not parse file.";
    return Response.json({ error: message }, { status: 422 });
  }
}
