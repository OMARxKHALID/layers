import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Morpho | Premium Media & Image Converter",
  description:
    "Morpho is a high-performance, private file converter for images, audio, and video. Convert to AVIF, WebP, MP4, and more with zero quality loss.",
  keywords: [
    "file converter",
    "image converter",
    "video converter",
    "audio converter",
    "avif converter",
    "webp converter",
    "private conversion",
    "lossless conversion",
  ],
  authors: [{ name: "Morpho Team" }],
  openGraph: {
    title: "Morpho | Premium Media & Image Converter",
    description:
      "The most elegant way to transform your media. Fast, private, and lossless.",
    url: "https://morpho.convert",
    siteName: "Morpho",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Morpho | Premium Media & Image Converter",
    description: "Elegant, fast, and private file conversion.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/mascot.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${pixelifySans.variable} antialiased`}>
        <div className="min-h-screen w-full relative overflow-hidden">
          <div
            className="fixed inset-0 z-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 60% 20%, rgba(175, 109, 255, 0.45), transparent 65%),
                radial-gradient(ellipse 70% 60% at 20% 80%, rgba(255, 100, 180, 0.40), transparent 65%),
                radial-gradient(ellipse 60% 50% at 60% 65%, rgba(255, 235, 170, 0.38), transparent 62%),
                radial-gradient(ellipse 65% 40% at 50% 60%, rgba(120, 190, 255, 0.42), transparent 68%),
                linear-gradient(180deg, #f7eaff 0%, #fde2ea 100%)
              `,
            }}
          />
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
