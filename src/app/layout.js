import "./globals.css";

export const metadata = {
  title: "Sound For Ears – Clinic Management",
  description: "Multi-role clinic management system for Sound For Ears.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        <div className="min-h-full safe-area-fixed">
          {children}
        </div>
      </body>
    </html>
  );
}
