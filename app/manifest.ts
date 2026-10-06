import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bingo de mesa — papel, tinta e sorte",
    short_name: "Bingo",
    description:
      "Uma cartela, suas canetinhas e um pouquinho de sorte. Jogue Bingo na sua mesa digital.",
    start_url: "/play",
    display: "standalone",
    background_color: "#2f1b12",
    theme_color: "#55321e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
