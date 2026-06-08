import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { caminhoLocal } from "./banco.server";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export const UPLOADS_PUBLIC_PREFIX = "/uploads/";

function resolverArquivoUpload(pathname: string): string | null {
  const relativo = pathname.slice(UPLOADS_PUBLIC_PREFIX.length);
  if (!relativo || relativo.includes("..") || relativo.includes("\0")) return null;
  const base = caminhoLocal("data", "uploads");
  const resolvido = path.resolve(base, relativo);
  if (!resolvido.startsWith(base + path.sep) && resolvido !== base) return null;
  try {
    if (!statSync(resolvido).isFile()) return null;
  } catch {
    return null;
  }
  return resolvido;
}

export function tentarServirUpload(pathname: string): Response | null {
  if (!pathname.startsWith(UPLOADS_PUBLIC_PREFIX)) return null;
  const arquivo = resolverArquivoUpload(pathname);
  if (!arquivo) return new Response("Não encontrado", { status: 404 });
  const ext = path.extname(arquivo).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const conteudo = readFileSync(arquivo);
  return new Response(conteudo, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-length": String(conteudo.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
