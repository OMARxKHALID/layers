import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify-sans",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://layers.convert"),
  title: "Layers | Professional Media & Image Converter",
  description:
    "Layers is a high-performance, private file converter for images, audio, and video. Convert to AVIF, WebP, MP4, and more with zero quality loss and professional results.",
  keywords: [
    "layers converter",
    "file converter",
    "image converter",
    "video converter",
    "audio converter",
    "avif converter",
    "webp converter",
    "private conversion",
    "professional conversion",
  ],
  authors: [{ name: "Layers Team" }],
  openGraph: {
    title: "Layers | Professional Media & Image Converter",
    description:
      "The professional way to transform your media layers. Fast, private, and high-quality.",
    url: "https://layers.convert",
    siteName: "Layers",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Layers | Professional Media & Image Converter",
    description: "Professional, fast, and private file conversion.",
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
      <body className={`${pixelifySans.variable} antialiased font-sans`}>
        <div className="min-h-screen w-full relative overflow-hidden">
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
