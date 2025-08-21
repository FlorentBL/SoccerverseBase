export default function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://soccerversebase.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/fr`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/en`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/es`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/it`,
      lastModified: new Date(),
    },
  ];
}

