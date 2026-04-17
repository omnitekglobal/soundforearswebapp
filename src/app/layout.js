import "./globals.css";
import RouteTransitionLoader from "@/components/layout/RouteTransitionLoader";
import PwaInstallPrompt from "@/components/layout/PwaInstallPrompt";

const APP_NAME = "Sound For Ears";
const APP_DEFAULT_TITLE = "Sound For Ears – Clinic Management";
const APP_TITLE_TEMPLATE = "%s – Sound For Ears";
const APP_DESCRIPTION =
  "Multi-role clinic management system for Sound For Ears.";

export const metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <RouteTransitionLoader>
          <div className="min-h-full safe-area-fixed">{children}</div>
        </RouteTransitionLoader>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
