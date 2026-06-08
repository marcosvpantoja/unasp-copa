export interface PrepararImagemOpts {
  maxLado?: number;
  qualidade?: number;
  tipo?: "image/jpeg" | "image/webp";
}

export interface ImagemPreparada {
  blob: Blob;
  base64: string;
  fileName: string;
  contentType: "image/jpeg" | "image/webp";
}

function carregarImagem(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = url;
  });
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return reject(new Error("Falha ao ler imagem"));
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler imagem"));
    reader.readAsDataURL(blob);
  });
}

export async function prepararImagem(
  file: File,
  opts: PrepararImagemOpts = {},
): Promise<ImagemPreparada> {
  const maxLado = opts.maxLado ?? 1024;
  const qualidade = opts.qualidade ?? 0.85;
  const tipo = opts.tipo ?? "image/jpeg";

  const img = await carregarImagem(file);
  const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
  const largura = Math.round(img.width * escala);
  const altura = Math.round(img.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  if (tipo === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
  }
  ctx.drawImage(img, 0, 0, largura, altura);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
      tipo,
      qualidade,
    ),
  );

  const base64 = await blobParaBase64(blob);
  const baseNome = file.name.replace(/\.[^.]+$/, "");
  const ext = tipo === "image/webp" ? "webp" : "jpg";
  return {
    blob,
    base64,
    fileName: `${baseNome}.${ext}`,
    contentType: tipo,
  };
}
