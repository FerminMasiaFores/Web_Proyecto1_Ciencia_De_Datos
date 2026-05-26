const buscadorRama = document.getElementById("buscadorRama");
const sugerenciasRama = document.getElementById("sugerenciasRama");
const contenedor = document.getElementById("todasLasConclusiones");

let conclusiones = [];

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearNumero(valor) {
  return Number(valor).toLocaleString("es-ES");
}

function obtenerRamasUnicas(lista) {
  const ramas = lista.map(item => item.rama);
  return [...new Set(ramas)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarRamas(texto) {
  const ramas = obtenerRamasUnicas(conclusiones);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return ramas;
  }

  return ramas.filter(rama =>
    normalizarTexto(rama).includes(textoNormalizado)
  );
}

function mostrarSugerenciasRama(coincidencias) {
  sugerenciasRama.innerHTML = "";

  if (coincidencias.length === 0) {
    sugerenciasRama.classList.add("hidden");
    return;
  }

  coincidencias.forEach(rama => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = rama;

    div.addEventListener("click", () => {
      buscadorRama.value = rama;
      sugerenciasRama.classList.add("hidden");
      filtrarConclusiones(rama);
    });

    sugerenciasRama.appendChild(div);
  });

  sugerenciasRama.classList.remove("hidden");
}

function crearParrafoDato(etiqueta, valor) {
  return `
    <p>
      <strong>${etiqueta}:</strong> 
      <span>${valor}</span>
    </p>
  `;
}

function renderizarConclusiones(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        <p>No se han encontrado conclusiones para esa rama universitaria.</p>
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const brecha = item.brecha_genero;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${item.titulo}</h2>

      <div class="card-info">
        ${crearParrafoDato("Total de personas", formatearNumero(item.total_personas))}
        ${crearParrafoDato("Mujeres", `${formatearNumero(brecha.mujeres)} (${brecha.porcentaje_mujeres}%)`)}
        ${crearParrafoDato("Hombres", `${formatearNumero(brecha.hombres)} (${brecha.porcentaje_hombres}%)`)}
        ${crearParrafoDato("Diferencia", formatearNumero(brecha.diferencia))}
      </div>

      <p class="conclusion-texto">${brecha.interpretacion}</p>
    `;

    contenedor.appendChild(card);
  });
}

function filtrarConclusiones(texto) {
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    renderizarConclusiones(conclusiones);
    return;
  }

  const filtradas = conclusiones.filter(item =>
    normalizarTexto(item.rama).includes(textoNormalizado) ||
    normalizarTexto(item.titulo).includes(textoNormalizado) ||
    normalizarTexto(item.brecha_genero.interpretacion).includes(textoNormalizado)
  );

  renderizarConclusiones(filtradas);
}

buscadorRama.addEventListener("focus", () => {
  const coincidencias = buscarRamas(buscadorRama.value);
  mostrarSugerenciasRama(coincidencias);
});

buscadorRama.addEventListener("input", () => {
  const valor = buscadorRama.value;
  const coincidencias = buscarRamas(valor);

  mostrarSugerenciasRama(coincidencias);
  filtrarConclusiones(valor);
});

document.addEventListener("click", event => {
  if (!event.target.closest(".autocomplete")) {
    sugerenciasRama.classList.add("hidden");
  }
});

fetch("./data/conclusiones-universidad.json")
  .then(response => response.json())
  .then(data => {
    conclusiones = data.ramas;
    renderizarConclusiones(conclusiones);
    console.log("Conclusiones de ramas cargadas:", conclusiones.length);
  })
  .catch(error => {
    console.error("Error cargando conclusiones de ramas universitarias:", error);

    contenedor.innerHTML = `
      <div class="card">
        <p>No se pudieron cargar las conclusiones de ramas universitarias.</p>
      </div>
    `;
  });