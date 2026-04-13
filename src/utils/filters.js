export function filterProducts(products, { search, category, maxPrice, sort }) {
  let result = [...products];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
    );
  }

  if (category && category !== "All") {
    result = result.filter((p) => p.category === category);
  }

  if (maxPrice !== undefined) {
    result = result.filter((p) => p.price <= maxPrice);
  }

  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
  else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));

  return result;
}
