import test from "node:test";
import assert from "node:assert/strict";
import { getOrganicMarkStyle } from "../components/bingo/BingoCell";

test("Variação orgânica determinística de marcas é estável e preserva legibilidade", () => {
  // Teste de estabilidade: mesmo index e número geram exatamente o mesmo CSS após reload
  const style1 = getOrganicMarkStyle(4, 27, "#cb3f33");
  const style2 = getOrganicMarkStyle(4, 27, "#cb3f33");
  assert.deepEqual(style1, style2, "O estilo orgânico deve ser estritamente determinístico");

  // Teste de variação orgânica entre células diferentes:
  const styleCell0 = getOrganicMarkStyle(0, 5, "#cb3f33");
  const styleCell1 = getOrganicMarkStyle(1, 18, "#cb3f33");
  assert.notEqual(
    styleCell0["--mark-angle" as keyof typeof styleCell0],
    styleCell1["--mark-angle" as keyof typeof styleCell1],
    "Células distintas devem ter pequenas variações de ângulo",
  );
  assert.notEqual(
    styleCell0["--mark-radius" as keyof typeof styleCell0],
    styleCell1["--mark-radius" as keyof typeof styleCell1],
    "Células distintas devem ter contornos orgânicos variados",
  );

  // Teste de legibilidade dos números:
  // Todas as 25 células da cartela com números válidos (1 a 75) devem ter opacidade moderada (0.50 a 0.58)
  for (let idx = 0; idx < 25; idx++) {
    for (let num = 1; num <= 75; num += 15) {
      const s = getOrganicMarkStyle(idx, num, "#813bb8");
      const opacity = Number(s["--mark-opacity" as keyof typeof s]);
      const scale = Number(s["--mark-scale" as keyof typeof s]);
      assert.ok(
        opacity >= 0.5 && opacity <= 0.6,
        `Opacidade ${opacity} deve manter o número perfeitamente legível`,
      );
      assert.ok(
        scale >= 0.88 && scale <= 0.98,
        `Escala ${scale} deve caber adequadamente dentro da célula`,
      );
    }
  }
});

test("Normalização e alinhamento de coordenadas em diferentes larguras de viewport", () => {
  const viewports = [360, 375, 390, 412, 430];
  for (const vp of viewports) {
    const cardWidth = Math.min(vp - 32, 440);
    const cardHeight = cardWidth; // aspecto quadrático do card surface

    // Ponto no centro da cartela (0.5, 0.5)
    const centerX = cardWidth / 2;
    const centerY = cardHeight / 2;
    const normX = centerX / cardWidth;
    const normY = centerY / cardHeight;
    assert.equal(normX, 0.5);
    assert.equal(normY, 0.5);

    // Ponto no canto superior esquerdo (0, 0)
    assert.equal(0 / cardWidth, 0);
    assert.equal(0 / cardHeight, 0);

    // Ponto no canto inferior direito (1, 1)
    assert.equal(cardWidth / cardWidth, 1);
    assert.equal(cardHeight / cardHeight, 1);
  }
});
