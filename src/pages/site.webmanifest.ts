import type { APIRoute } from "astro";
import { site } from "~/lib/site";
import { tokens } from "~/styles/tokens";

/** The web manifest. Its colours are the theme's page colour, from the tokens. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: site.name,
        short_name: "Guus E.",
        description: "Tech lead infrastructure at Harborn in Rotterdam.",
        start_url: "/",
        display: "browser",
        background_color: tokens.surface.hex,
        theme_color: tokens.surface.hex,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
        ],
      },
      null,
      2,
    ) + "\n",
    { headers: { "Content-Type": "application/manifest+json" } },
  );
