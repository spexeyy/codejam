export function Closing() {
  return (
    <div className="flex h-full items-center gap-16 px-16 pb-10">
      <div className="flex flex-1 flex-col gap-8">
        <h2 className="text-hero font-medium text-fg">Gracias</h2>
        <p className="max-w-2xl text-lead text-fg-2">
          913 en la práctica, 0 derrotas contra OR-Tools en 20 escenarios y el
          evento 1 resuelto en 23 minutos.
        </p>
        <p className="text-slide text-fg-3">
          Ignacio Bertola · Felix de Felice
        </p>
      </div>
      <figure className="flex flex-col items-center gap-4">
        <img
          src="/qr-github.svg"
          alt="Código QR del repositorio github.com/spexeyy/codejam"
          className="size-96 rounded-card border border-border"
        />
        <figcaption className="text-lead text-fg-2">
          github.com/spexeyy/codejam
        </figcaption>
      </figure>
    </div>
  );
}
