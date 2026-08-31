import { createFileRoute } from "@tanstack/react-router";
import { json, options204 } from "@/lib/steam-catalogue";

const GENRES = [
  "Action",
  "Adventure",
  "Casual",
  "Indie",
  "Massively Multiplayer",
  "Racing",
  "RPG",
  "Simulation",
  "Sports",
  "Strategy",
  "Free to Play",
  "Early Access",
  "Horror",
  "Shooter",
  "Puzzle",
  "Platformer",
  "Open World",
  "Survival",
  "Co-op",
  "Multiplayer",
];

const TAGS: Record<string, number> = Object.fromEntries(
  GENRES.map((genre, index) => [genre, index + 1])
);

export const Route = createFileRoute("/api/public/catalogue/steam/$resource")({
  server: {
    handlers: {
      OPTIONS: async () => options204(),
      GET: async ({ params }) => {
        switch (params.resource) {
          case "genres":
            return json(GENRES);
          case "tags":
            return json(TAGS);
          case "publishers":
          case "developers":
            return json([]);
          case "executables":
            return json({});
          default:
            return json([]);
        }
      },
    },
  },
});
