const modules = [
  { name: "Dominio (workshop)", state: "Listo", ready: true },
  { name: "Persistencia (store)", state: "Pendiente", ready: false },
  { name: "HTTP y sesión del dueño", state: "Pendiente", ready: false },
  { name: "Página del cliente", state: "Pendiente", ready: false },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Taller Don Ramiro</p>
        <h1>Tu reparación, sin llamadas.</h1>
        <p>
          Consulta el estado del trabajo y aprueba cotizaciones desde el enlace
          que te comparte el taller. Sin instalar nada y sin crear cuenta.
        </p>
        <span className="badge">MVP en construcción</span>
      </header>

      <section className="panel" aria-labelledby="estado">
        <h2 id="estado">Estado del sistema</h2>
        <ul className="modules">
          {modules.map((module) => (
            <li key={module.name}>
              <span className="name">{module.name}</span>
              <span className={module.ready ? "state ready" : "state"}>
                {module.state}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="foot">
        La primera pieza ya está probada: crear orden, generar el enlace y
        cotizar. Sigue la persistencia en Redis y la página pública.
      </p>
    </main>
  );
}
