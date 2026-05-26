const buscadorParo = document.getElementById("buscadorParo");
const sugerenciasParo = document.getElementById("sugerenciasParo");
const contenedor = document.getElementById("todasLasConclusiones");

let conclusiones = [];

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function obtenerComparaciones(lista) {
  return lista.map(item => item.comparacion)
    .sort((a, b) => a.localeCompare(b, "es"));
}

function buscarComparaciones(texto) {
  const comparaciones = obtenerComparaciones(conclusiones);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return comparaciones;
  }

  return comparaciones.filter(comparacion =>
    normalizarTexto(comparacion).includes(textoNormalizado)
  );
}

function mostrarSugerenciasParo(coincidencias) {
  sugerenciasParo.innerHTML = "";

  if (coincidencias.length === 0) {
    sugerenciasParo.classList.add("hidden");
    return;
  }

  coincidencias.forEach(comparacion => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = comparacion;

    div.addEventListener("click", () => {
      buscadorParo.value = comparacion;
      sugerenciasParo.classList.add("hidden");
      filtrarConclusiones(comparacion);
    });

    sugerenciasParo.appendChild(div);
  });

  sugerenciasParo.classList.remove("hidden");
}

function renderizarConclusiones(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        <p>No se han encontrado conclusiones para esa comparación.</p>
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${item.comparacion}</h2>
      <p>${item.conclusion}</p>
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
    normalizarTexto(item.comparacion).includes(textoNormalizado) ||
    normalizarTexto(item.conclusion).includes(textoNormalizado)
  );

  renderizarConclusiones(filtradas);
}

buscadorParo.addEventListener("focus", () => {
  mostrarSugerenciasParo(buscarComparaciones(buscadorParo.value));
});

buscadorParo.addEventListener("input", () => {
  const valor = buscadorParo.value;
  mostrarSugerenciasParo(buscarComparaciones(valor));
  filtrarConclusiones(valor);
});

document.addEventListener("click", event => {
  if (!event.target.closest(".autocomplete")) {
    sugerenciasParo.classList.add("hidden");
  }
});

fetch("./data/conclusiones-paro.json")
  .then(response => response.json())
  .then(data => {
    conclusiones = data.conclusiones;
    renderizarConclusiones(conclusiones);
  })
  .catch(error => {
    console.error("Error cargando conclusiones de paro:", error);
    contenedor.innerHTML = `
      <div class="card">
        <p>No se pudieron cargar las conclusiones.</p>
      </div>
    `;
  });