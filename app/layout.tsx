// app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Título básico */}
        <title>MonyFit Timer Lab</title>

        {/* Para que se vea bien en móvil */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />

        {/* Colores del navegador / barra de estado */}
        <meta name="theme-color" content="#000000" />
        <meta name="background-color" content="#000000" />

        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicon / iconos normales */}
        <link
          rel="icon"
          href="/icon-192.png"
          sizes="192x192"
          type="image/png"
        />
        <link
          rel="icon"
          href="/icon-256.png"
          sizes="256x256"
          type="image/png"
        />
        <link
          rel="icon"
          href="/icon-384.png"
          sizes="384x384"
          type="image/png"
        />
        <link
          rel="icon"
          href="/icon-512.png"
          sizes="512x512"
          type="image/png"
        />

        {/* Icono para iOS (Add to Home Screen en iPhone/iPad) */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icon-192.png"
        />
      </head>

      <body className="min-h-screen bg-black text-slate-100">
        {children}

        {/* 
        Si más adelante quieres registrar un Service Worker “a mano”, 
        puedes meter algo como esto aquí (debajo de {children}):

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js");
                });
              }
            `,
          }}
        />
        */}
      </body>
    </html>
  );
}
