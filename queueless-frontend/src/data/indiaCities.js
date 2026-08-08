export async function loadIndiaCities() {
  // Public source: large cities dataset (country_code === 'IN')
  const url = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/cities.json";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch cities');
    const data = await res.json();
    const india = data.filter((c) => c.country_code === "IN");
    const names = india.map((c) => c.name.trim());
    const uniq = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    return uniq;
  } catch (err) {
    console.error("Failed to load India cities, falling back to smaller list:", err);
    return [
      "All Cities",
      "Hyderabad",
      "Warangal",
      "Hanamkonda",
      "Vijayawada",
      "Visakhapatnam",
      "Mumbai",
      "Delhi",
      "Bengaluru",
      "Kolkata",
      "Chennai",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Lucknow",
      "Nagpur",
      "Indore",
      "Thane",
      "Bhopal",
    ];
  }
}
