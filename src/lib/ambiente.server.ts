import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

let carregado = false;

export function carregarAmbiente() {
  if (carregado) return;
  carregado = true;

  const caminho = path.join(process.cwd(), ".env");
  if (!existsSync(caminho)) return;

  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const texto = linha.trim();
    if (!texto || texto.startsWith("#")) continue;

    const indice = texto.indexOf("=");
    if (indice <= 0) continue;

    const chave = texto.slice(0, indice).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(chave)) continue;
    if (process.env[chave] !== undefined) continue;

    let valor = texto.slice(indice + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    process.env[chave] = valor;
  }
}

carregarAmbiente();
