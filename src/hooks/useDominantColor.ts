import { useState, useEffect } from 'react';

// Generates smooth fallback colors from string hash (e.g. track id or album title)
const hashColor = (str: string): { primary: string; secondary: string; rgb: string } => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 80) % 360;
  return {
    primary: `hsl(${h1}, 75%, 55%)`,
    secondary: `hsl(${h2}, 80%, 50%)`,
    rgb: `${(Math.abs(hash) * 13) % 180 + 60}, ${(Math.abs(hash) * 31) % 180 + 60}, ${(Math.abs(hash) * 57) % 180 + 60}`
  };
};

export const useDominantColor = (imageUrl?: string, id?: string) => {
  const [colors, setColors] = useState<{ primary: string; secondary: string; rgb: string }>({
    primary: 'rgba(99, 102, 241, 0.6)',
    secondary: 'rgba(16, 185, 129, 0.6)',
    rgb: '99, 102, 241'
  });

  useEffect(() => {
    if (!imageUrl) return;

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);

        const imageData = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, count = 0;

        // Sample non-extreme pixels for rich color
        for (let i = 0; i < imageData.length; i += 16) {
          const red = imageData[i];
          const green = imageData[i + 1];
          const blue = imageData[i + 2];
          const alpha = imageData[i + 3];

          if (alpha > 128 && (red > 20 || green > 20 || blue > 20) && (red < 240 || green < 240 || blue < 240)) {
            r += red;
            g += green;
            b += blue;
            count++;
          }
        }

        if (count > 0 && isMounted) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          const primaryRgb = `${r}, ${g}, ${b}`;
          const primary = `rgb(${r}, ${g}, ${b})`;

          // Compute vibrant complementary secondary color
          const secR = (r + 90) % 255;
          const secG = (g + 140) % 255;
          const secB = (b + 180) % 255;
          const secondary = `rgb(${secR}, ${secG}, ${secB})`;

          setColors({ primary, secondary, rgb: primaryRgb });
        } else if (id && isMounted) {
          setColors(hashColor(id + (imageUrl || '')));
        }
      } catch {
        if (id && isMounted) {
          setColors(hashColor(id + (imageUrl || '')));
        }
      }
    };

    img.onerror = () => {
      if (id && isMounted) {
        setColors(hashColor(id + (imageUrl || '')));
      }
    };

    return () => {
      isMounted = false;
    };
  }, [imageUrl, id]);

  return colors;
};
