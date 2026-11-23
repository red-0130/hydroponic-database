import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hydroponic Database',
    short_name: 'HydroDB',
    description: 'Hydroponic plant database and nutrient requirement reference for growers',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#059669',
    icons: [
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
