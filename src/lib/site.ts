/** Facts about the site and its owner that more than one page needs. */
export const site = {
  name: "Guus Ekkelenkamp",
  url: "https://ekkelenkamp.dev",
  email: "ekkelenkampguus@gmail.com",
  linkedin: "https://www.linkedin.com/in/guus-ekkelenkamp/",
  github: "https://github.com/guuse",
  repo: "https://github.com/guuse/portfolio",
  jobTitle: "Tech lead infrastructure",
  employer: "Harborn",
  city: "Rotterdam",
  themeColor: "#0a1328",
} as const;

/**
 * The main navigation. `match` decides which entry is the current page; `section` is the
 * homepage section an entry stands for, so the nav can follow along as you scroll there.
 */
export const nav = [
  { label: "Home", href: "/", match: (path: string) => path === "/" },
  {
    label: "Projects",
    href: "/projects/",
    match: (path: string) => path.startsWith("/projects/"),
    section: "projects",
  },
  { label: "Experience", href: "/#experience", match: () => false, section: "experience" },
  { label: "Contact", href: "/#contact", match: () => false, section: "contact" },
] as const;
