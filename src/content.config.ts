import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import * as schema from "./content/schemas";

const yaml = (name: string) => file(`src/content/${name}.yaml`);

export const collections = {
  experience: defineCollection({ loader: yaml("experience"), schema: schema.experience }),
  interests: defineCollection({ loader: yaml("interests"), schema: schema.interest }),
  principles: defineCollection({ loader: yaml("principles"), schema: schema.principle }),
  skills: defineCollection({ loader: yaml("skills"), schema: schema.skill }),
  projects: defineCollection({ loader: yaml("projects"), schema: schema.project }),
  also: defineCollection({ loader: yaml("also"), schema: schema.also }),
};
