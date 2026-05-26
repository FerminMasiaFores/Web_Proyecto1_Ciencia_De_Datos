const sector1Input = document.getElementById("sector1");
const sector2Input = document.getElementById("sector2");
const sugerencias1 = document.getElementById("sugerencias1");
const sugerencias2 = document.getElementById("sugerencias2");
const compararBtn = document.getElementById("compararBtn");
const resultado = document.getElementById("resultado");

let datos = [];
let conclusiones = [];
let sectorSeleccionado1 = null;
let sectorSeleccionado2 = null;
let graficoActual = null;

function formatearEuros(valor) {
  return Number(valor).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
}

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function limpiarSectorNombre(sector) {
  if (!sector) return "";
  return String(sector).replace(/^[A-Z0-9_]+\s+/, "").trim();
}

function parsearNumero(valor) {
  if (valor === null || valor === undefined || valor === "") return NaN;

  if (typeof valor === "number") {
    return valor;
  }

  const texto = String(valor).trim();

  if (texto.includes(",") && texto.includes(".")) {
    return Number(texto.replace(/\./g, "").replace(",", "."));
  }

  if (texto.includes(",")) {
    return Number(texto.replace(",", "."));
  }

  return Number(texto);
}

function prepararDatosComparador(lista) {
  return lista
    .filter(item =>
      item &&
      item.Sector &&
      item.Sexo === "Ambos sexos" &&
      item.Componente === "Salario bruto" &&
      item.Total !== null &&
      item.Total !== ""
    )
    .map(item => ({
      sector: limpiarSectorNombre(item.Sector),
      salarioMedio: parsearNumero(item.Total),
      cnae: item.CNAE_codigo || "No disponible",
      periodo: item.Periodo || "No disponible",
      clasificacion: item.Clasificacion || "No disponible"
    }))
    .filter(item => item.sector && !Number.isNaN(item.salarioMedio))
    .sort((a, b) => a.sector.localeCompare(b.sector, "es"));
}

function obtenerSectoresUnicos(lista) {
  const nombres = lista.map(item => item.sector);
  return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarCoincidencias(texto) {
  const sectores = obtenerSectoresUnicos(datos);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return sectores;
  }

  return sectores.filter(sector =>
    normalizarTexto(sector).includes(textoNormalizado)
  );
}

function mostrarSugerencias(input, contenedor, coincidencias, numeroCampo) {
  contenedor.innerHTML = "";

  if (coincidencias.length === 0) {
    contenedor.classList.add("hidden");
    return;
  }

  coincidencias.forEach(sector => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = sector;

    div.addEventListener("click", () => {
      input.value = sector;
      sugerencias1.classList.add("hidden");
      sugerencias2.classList.add("hidden");

      if (numeroCampo === 1) {
        sectorSeleccionado1 = datos.find(item => item.sector === sector);
      } else {
        sectorSeleccionado2 = datos.find(item => item.sector === sector);
      }
    });

    contenedor.appendChild(div);
  });

  contenedor.classList.remove("hidden");
}

function obtenerConclusionesPorSector(sector, cnae) {
  return conclusiones.find(item =>
    normalizarTexto(item.sector) === normalizarTexto(sector) ||
    String(item.division_cnae09) === String(cnae)
  );
}

function mostrarConclusiones(a, b) {
  const conclusionA = obtenerConclusionesPorSector(a.sector, a.cnae);
  const conclusionB = obtenerConclusionesPorSector(b.sector, b.cnae);

  const titulo1 = document.getElementById("tituloConclusion1");
  const lista1 = document.getElementById("listaConclusiones1");

  const titulo2 = document.getElementById("tituloConclusion2");
  const lista2 = document.getElementById("listaConclusiones2");

  lista1.innerHTML = "";
  lista2.innerHTML = "";

  if (conclusionA) {
    titulo1.textContent = conclusionA.titulo;
    conclusionA.conclusiones.forEach(texto => {
      const li = document.createElement("li");
      li.textContent = texto;
      lista1.appendChild(li);
    });
  } else {
    titulo1.textContent = `Conclusiones del sector: ${a.sector}`;
    const li = document.createElement("li");
    li.textContent = "No hay conclusiones disponibles para este sector.";
    lista1.appendChild(li);
  }

  if (conclusionB) {
    titulo2.textContent = conclusionB.titulo;
    conclusionB.conclusiones.forEach(texto => {
      const li = document.createElement("li");
      li.textContent = texto;
      lista2.appendChild(li);
    });
  } else {
    titulo2.textContent = `Conclusiones del sector: ${b.sector}`;
    const li = document.createElement("li");
    li.textContent = "No hay conclusiones disponibles para este sector.";
    lista2.appendChild(li);
  }

  const conclusionesComparacion = document.getElementById("conclusionesComparacion");

  conclusionesComparacion.classList.remove("hidden");
  conclusionesComparacion.classList.remove("animar-entrada");
  void conclusionesComparacion.offsetWidth;
  conclusionesComparacion.classList.add("animar-entrada");
}

function mostrarGraficoSectores(a, b) {
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
      labels: [a.sector, b.sector],
      datasets: [
        {
          label: "Salario bruto",
          data: [a.salarioMedio, b.salarioMedio],
          backgroundColor: [
            "rgba(212, 175, 55, 0.75)",
            "rgba(139, 111, 42, 0.75)"
          ],
          borderColor: [
            "rgba(212, 175, 55, 1)",
            "rgba(139, 111, 42, 1)"
          ],
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
              return ` ${formatearEuros(context.raw)}`;
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
              return Number(value).toLocaleString("es-ES") + " €";
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
  document.getElementById("nombre1").textContent = a.sector;
  document.getElementById("salario1").textContent = formatearEuros(a.salarioMedio);
  document.getElementById("cnae1").textContent = a.cnae;
  document.getElementById("periodo1").textContent = a.periodo;

  document.getElementById("nombre2").textContent = b.sector;
  document.getElementById("salario2").textContent = formatearEuros(b.salarioMedio);
  document.getElementById("cnae2").textContent = b.cnae;
  document.getElementById("periodo2").textContent = b.periodo;

  const diferencia = a.salarioMedio - b.salarioMedio;
  const ganador = diferencia > 0 ? a.sector : b.sector;
  const valorDif = Math.abs(diferencia);

  document.getElementById("diferencia").textContent =
    `${ganador} tiene un salario bruto superior por ${formatearEuros(valorDif)}.`;

  resultado.classList.remove("hidden");
  resultado.classList.remove("animar-entrada");
  void resultado.offsetWidth;
  resultado.classList.add("animar-entrada");

  mostrarConclusiones(a, b);
  mostrarGraficoSectores(a, b);
}

function buscarSectorExacto(nombre) {
  return datos.find(
    item => normalizarTexto(item.sector) === normalizarTexto(nombre)
  );
}

sector1Input.addEventListener("focus", () => {
  sugerencias2.classList.add("hidden");
  const coincidencias = buscarCoincidencias(sector1Input.value);
  mostrarSugerencias(sector1Input, sugerencias1, coincidencias, 1);
});

sector2Input.addEventListener("focus", () => {
  sugerencias1.classList.add("hidden");
  const coincidencias = buscarCoincidencias(sector2Input.value);
  mostrarSugerencias(sector2Input, sugerencias2, coincidencias, 2);
});

sector1Input.addEventListener("input", () => {
  sectorSeleccionado1 = null;
  sugerencias2.classList.add("hidden");
  const coincidencias = buscarCoincidencias(sector1Input.value);
  mostrarSugerencias(sector1Input, sugerencias1, coincidencias, 1);
});

sector2Input.addEventListener("input", () => {
  sectorSeleccionado2 = null;
  sugerencias1.classList.add("hidden");
  const coincidencias = buscarCoincidencias(sector2Input.value);
  mostrarSugerencias(sector2Input, sugerencias2, coincidencias, 2);
});

compararBtn.addEventListener("click", () => {
  const a = sectorSeleccionado1 || buscarSectorExacto(sector1Input.value);
  const b = sectorSeleccionado2 || buscarSectorExacto(sector2Input.value);

  if (!a || !b) {
    alert("Selecciona dos sectores válidos de la lista.");
    return;
  }

  if (normalizarTexto(a.sector) === normalizarTexto(b.sector)) {
    alert("Selecciona dos sectores distintos.");
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
  fetch("./data/sectores.json").then(res => res.json()),
  fetch("./data/conclusiones-sectores.json").then(res => res.json())
])
  .then(([salariosData, conclusionesData]) => {
    datos = prepararDatosComparador(salariosData);
    conclusiones = conclusionesData;
    console.log("Sectores cargados:", datos.length);
  })
  .catch((error) => {
    console.error("Error cargando los datos:", error);
  });