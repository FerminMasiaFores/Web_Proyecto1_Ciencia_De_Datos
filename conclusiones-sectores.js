const buscadorSector = document.getElementById("buscadorSector");
const sugerenciasSector = document.getElementById("sugerenciasSector");
const contenedor = document.getElementById("todasLasConclusiones");

let conclusiones = [];

function obtenerSectoresUnicos(lista) {
  const sectores = lista.map(item => item.sector);
  return [...new Set(sectores)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarSectores(texto) {
  const sectores = obtenerSectoresUnicos(conclusiones);
  const textoNormalizado = texto.trim().toLowerCase();

  if (!textoNormalizado) {
    return sectores;
  }

  return sectores.filter(sector =>
    sector.toLowerCase().includes(textoNormalizado)
  );
}

function mostrarSugerenciasSector(coincidencias) {
  sugerenciasSector.innerHTML = "";

  if (coincidencias.length === 0) {
    sugerenciasSector.classList.add("hidden");
    return;
  }

  coincidencias.forEach(sector => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = sector;

    div.addEventListener("click", () => {
      buscadorSector.value = sector;
      sugerenciasSector.classList.add("hidden");
      filtrarConclusiones(sector);
    });

    sugerenciasSector.appendChild(div);
  });

  sugerenciasSector.classList.remove("hidden");
}

function renderizarConclusiones(lista) {
  contenedor.innerHTML = "";

  if (lista.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        <p>No se han encontrado conclusiones para ese sector.</p>
      </div>
    `;
    return;
  }

  lista.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    const titulo = document.createElement("h2");
    titulo.textContent = item.titulo;

    const listaHtml = document.createElement("ul");

    item.conclusiones.forEach(texto => {
      const li = document.createElement("li");
      li.textContent = texto;
      listaHtml.appendChild(li);
    });

    card.appendChild(titulo);
    card.appendChild(listaHtml);
    contenedor.appendChild(card);
  });
}

function filtrarConclusiones(texto) {
  const textoNormalizado = texto.trim().toLowerCase();

  if (!textoNormalizado) {
    renderizarConclusiones(conclusiones);
    return;
  }

  const filtradas = conclusiones.filter(item =>
    item.sector.toLowerCase().includes(textoNormalizado)
  );

  renderizarConclusiones(filtradas);
}

buscadorSector.addEventListener("focus", () => {
  const coincidencias = buscarSectores(buscadorSector.value);
  mostrarSugerenciasSector(coincidencias);
});

buscadorSector.addEventListener("input", () => {
  const valor = buscadorSector.value;
  const coincidencias = buscarSectores(valor);
  mostrarSugerenciasSector(coincidencias);
  filtrarConclusiones(valor);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".autocomplete")) {
    sugerenciasSector.classList.add("hidden");
  }
});

fetch("./data/conclusiones-sectores.json")
  .then(response => response.json())
  .then(data => {
    conclusiones = data;
    renderizarConclusiones(conclusiones);
  })
  .catch(error => {
    console.error("Error cargando conclusiones:", error);
    contenedor.innerHTML = `
      <div class="card">
        <p>No se pudieron cargar las conclusiones.</p>
      </div>
    `;
  });