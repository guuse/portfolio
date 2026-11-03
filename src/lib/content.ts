import { getCollection, type CollectionEntry, type CollectionKey } from "astro:content";

/** A collection's entries as data, in the order the YAML file gives them. */
export async function list<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>["data"][]> {
  const entries: CollectionEntry<C>[] = await getCollection(name);
  return entries.map((e) => e.data as CollectionEntry<C>["data"]).sort((a, b) => a.order - b.order);
}
