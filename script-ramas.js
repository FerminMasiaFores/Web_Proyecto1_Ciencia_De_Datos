const rama1Input = document.getElementById("rama1");
const rama2Input = document.getElementById("rama2");
const sugerencias1 = document.getElementById("sugerencias1");
const sugerencias2 = document.getElementById("sugerencias2");
const compararBtn = document.getElementById("compararBtn");
const resultado = document.getElementById("resultado");

let datos = [];
let conclusiones = [];
let ramaSeleccionada1 = null;
let ramaSeleccionada2 = null;
let graficoActual = null;

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function formatearNumero(valor) {
  return Number(valor).toLocaleString("es-ES");
}

function prepararDatosUniversidad(lista) {
  const ramas = [...new Set(lista.map(item => item["Rama de conocimiento"]))];

  return ramas.map(rama => {
    const registros = lista.filter(item => item["Rama de conocimiento"] === rama);

    const hombres = registros
      .filter(item => item.Sexo === "Hombres")
      .reduce((acc, item) => acc + Number(item.Total || 0), 0);

    const mujeres = registros
      .filter(item => item.Sexo === "Mujeres")
      .reduce((acc, item) => acc + Number(item.Total || 0), 0);

    const publicas = registros
      .filter(item => item.TipoUni_abrev === "Públicas")
      .reduce((acc, item) => acc + Number(item.Total || 0), 0);

    const privadas = registros
      .filter(item => item.TipoUni_abrev === "Privadas")
      .reduce((acc, item) => acc + Number(item.Total || 0), 0);

    return {
      rama,
      total: hombres + mujeres,
      hombres,
      mujeres,
      publicas,
      privadas
    };
  }).sort((a, b) => a.rama.localeCompare(b.rama, "es"));
}

function obtenerRamasUnicas(lista) {
  return lista.map(item => item.rama).sort((a, b) => a.localeCompare(b, "es"));
}

function buscarCoincidencias(texto) {
  const ramas = obtenerRamasUnicas(datos);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return ramas;
  }

  return ramas.filter(rama =>
    normalizarTexto(rama).includes(textoNormalizado)
  );
}

function mostrarSugerencias(input, contenedor, coincidencias, numeroCampo) {
  contenedor.innerHTML = "";

  if (coincidencias.length === 0) {
    contenedor.classList.add("hidden");
    return;
  }

  coincidencias.forEach(rama => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = rama;

    div.addEventListener("click", () => {
      input.value = rama;
      sugerencias1.classList.add("hidden");
      sugerencias2.classList.add("hidden");

      if (numeroCampo === 1) {
        ramaSeleccionada1 = datos.find(item => item.rama === rama);
      } else {
        ramaSeleccionada2 = datos.find(item => item.rama === rama);
      }
    });

    contenedor.appendChild(div);
  });

  contenedor.classList.remove("hidden");
}

function buscarRamaExacta(nombre) {
  return datos.find(item =>
    normalizarTexto(item.rama) === normalizarTexto(nombre)
  );
}

function obtenerConclusionPorRama(rama) {
  return conclusiones.find(item =>
    normalizarTexto(item.rama) === normalizarTexto(rama)
  );
}

function mostrarConclusiones(a, b) {
  const conclusionA = obtenerConclusionPorRama(a.rama);
  const conclusionB = obtenerConclusionPorRama(b.rama);

  document.getElementById("tituloConclusion1").textContent = conclusionA
    ? conclusionA.titulo
    : `Conclusión de ${a.rama}`;

  document.getElementById("textoConclusion1").textContent = conclusionA
    ? conclusionA.brecha_genero.interpretacion
    : "No hay conclusión disponible para esta rama.";

  document.getElementById("tituloConclusion2").textContent = conclusionB
    ? conclusionB.titulo
    : `Conclusión de ${b.rama}`;

  document.getElementById("textoConclusion2").textContent = conclusionB
    ? conclusionB.brecha_genero.interpretacion
    : "No hay conclusión disponible para esta rama.";

  const conclusionesComparacion = document.getElementById("conclusionesComparacion");

  conclusionesComparacion.classList.remove("hidden");
  conclusionesComparacion.classList.remove("animar-entrada");
  void conclusionesComparacion.offsetWidth;
  conclusionesComparacion.classList.add("animar-entrada");
}

function mostrarGraficoRamas(a, b) {
  const seccionGrafico = document.getElementById("graficoComparacion");
  const canvas = document.getElementById("grafico");

  if (!seccionGrafico || !canvas || typeof Chart === "undefined") {
    console.warn("No se puede cargar el gráfico. Revisa Chart.js y el canvas.");
    return;
  }

  seccionGrafico.classList.remove("hidden");
  seccionGrafico.classList.remove("animar-entrada");
  void seccionGrafico.offsetWidth;
  seccionGrafico.classList.add("animar-entrada");

  if (graficoActual) {
    graficoActual.destroy();
  }

  graficoActual = new Chart(canvas, {
    type: "bar",
    data: {
      labels: [
        "Total",
        "Hombres",
        "Mujeres",
        "Universidad pública",
        "Universidad privada"
      ],
      datasets: [
        {
          label: a.rama,
          data: [
            a.total,
            a.hombres,
            a.mujeres,
            a.publicas,
            a.privadas
          ],
          backgroundColor: "rgba(212, 175, 55, 0.75)",
          borderColor: "rgba(212, 175, 55, 1)",
          borderWidth: 2,
          borderRadius: 10
        },
        {
          label: b.rama,
          data: [
            b.total,
            b.hombres,
            b.mujeres,
            b.publicas,
            b.privadas
          ],
          backgroundColor: "rgba(139, 111, 42, 0.75)",
          borderColor: "rgba(139, 111, 42, 1)",
          borderWidth: 2,
          borderRadius: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#d6dee9",
            font: {
              size: 14,
              weight: "bold"
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ${formatearNumero(context.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#d6dee9",
            font: {
              size: 13,
              weight: "bold"
            }
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        },
        y: {
          ticks: {
            color: "#d6dee9",
            callback: function(value) {
              return Number(value).toLocaleString("es-ES");
            }
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          }
        }
      }
    }
  });
}

function mostrarComparacion(a, b) {
  document.getElementById("nombre1").textContent = a.rama;
  document.getElementById("total1").textContent = formatearNumero(a.total);
  document.getElementById("hombres1").textContent = formatearNumero(a.hombres);
  document.getElementById("mujeres1").textContent = formatearNumero(a.mujeres);
  document.getElementById("publicas1").textContent = formatearNumero(a.publicas);
  document.getElementById("privadas1").textContent = formatearNumero(a.privadas);

  document.getElementById("nombre2").textContent = b.rama;
  document.getElementById("total2").textContent = formatearNumero(b.total);
  document.getElementById("hombres2").textContent = formatearNumero(b.hombres);
  document.getElementById("mujeres2").textContent = formatearNumero(b.mujeres);
  document.getElementById("publicas2").textContent = formatearNumero(b.publicas);
  document.getElementById("privadas2").textContent = formatearNumero(b.privadas);

  const diferencia = a.total - b.total;
  const mayor = diferencia > 0 ? a.rama : b.rama;

  document.getElementById("diferencia").textContent =
    `${mayor} tiene ${formatearNumero(Math.abs(diferencia))} estudiantes más en total.`;

  resultado.classList.remove("hidden");
  resultado.classList.remove("animar-entrada");
  void resultado.offsetWidth;
  resultado.classList.add("animar-entrada");

  mostrarConclusiones(a, b);
  mostrarGraficoRamas(a, b);
}

rama1Input.addEventListener("focus", () => {
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(rama1Input, sugerencias1, buscarCoincidencias(rama1Input.value), 1);
});

rama2Input.addEventListener("focus", () => {
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(rama2Input, sugerencias2, buscarCoincidencias(rama2Input.value), 2);
});

rama1Input.addEventListener("input", () => {
  ramaSeleccionada1 = null;
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(rama1Input, sugerencias1, buscarCoincidencias(rama1Input.value), 1);
});

rama2Input.addEventListener("input", () => {
  ramaSeleccionada2 = null;
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(rama2Input, sugerencias2, buscarCoincidencias(rama2Input.value), 2);
});

compararBtn.addEventListener("click", () => {
  const a = ramaSeleccionada1 || buscarRamaExacta(rama1Input.value);
  const b = ramaSeleccionada2 || buscarRamaExacta(rama2Input.value);

  if (!a || !b) {
    alert("Selecciona dos ramas válidas de la lista.");
    return;
  }

  if (normalizarTexto(a.rama) === normalizarTexto(b.rama)) {
    alert("Selecciona dos ramas distintas.");
    return;
  }

  mostrarComparacion(a, b);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".autocomplete")) {
    sugerencias1.classList.add("hidden");
    sugerencias2.classList.add("hidden");
  }
});

Promise.all([
  fetch("./data/universidad.json").then(res => res.json()),
  fetch("./data/conclusiones-universidad.json").then(res => res.json())
])
  .then(([universidadData, conclusionesData]) => {
    datos = prepararDatosUniversidad(universidadData);
    conclusiones = conclusionesData.ramas;
    console.log("Ramas universitarias cargadas:", datos.length);
  })
  .catch(error => {
    console.error("Error cargando datos universitarios:", error);
  });