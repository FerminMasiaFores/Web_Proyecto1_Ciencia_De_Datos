const buscadorPais = document.getElementById("buscadorPais");
const sugerenciasPais = document.getElementById("sugerenciasPais");
const contenedor = document.getElementById("todasLasConclusiones");

let conclusiones = [];

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function obtenerPaisesUnicos(lista) {
  const paises = lista.map(item => item.pais);
  return [...new Set(paises)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarPaises(texto) {
  const paises = obtenerPaisesUnicos(conclusiones);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return paises;
  }

  return paises.filter(pais =>
    normalizarTexto(pais).includes(textoNormalizado)
  );
}

function mostrarSugerenciasPais(coincidencias) {
  sugerenciasPais.innerHTML = "";

  if (coincidencias.length === 0) {
    sugerenciasPais.classList.add("hidden");
    return;
  }

  coincidencias.forEach(pais => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = pais;

    div.addEventListener("click", () => {
      buscadorPais.value = pais;
      sugerenciasPais.classList.add("hidden");
      filtrarConclusiones(pais);
    });

    sugerenciasPais.appendChild(div);
  });

  sugerenciasPais.classList.remove("hidden");
}

function renderizarConclusiones(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        <p>No se han encontrado conclusiones para ese país.</p>
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>Conclusión de ${item.pais}</h2>
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
    normalizarTexto(item.pais).includes(textoNormalizado)
  );

  renderizarConclusiones(filtradas);
}

buscadorPais.addEventListener("focus", () => {
  mostrarSugerenciasPais(buscarPaises(buscadorPais.value));
});

buscadorPais.addEventListener("input", () => {
  const valor = buscadorPais.value;
  mostrarSugerenciasPais(buscarPaises(valor));
  filtrarConclusiones(valor);
});

document.addEventListener("click", event => {
  if (!event.target.closest(".autocomplete")) {
    sugerenciasPais.classList.add("hidden");
  }
});

fetch("./data/conclusiones-paises.json")
  .then(response => response.json())
  .then(data => {
    conclusiones = data;
    renderizarConclusiones(conclusiones);
  })
  .catch(error => {
    console.error("Error cargando conclusiones de países:", error);
    contenedor.innerHTML = `
      <div class="card">
        <p>No se pudieron cargar las conclusiones.</p>
      </div>
    `;
  });