const nivel1Input = document.getElementById("nivel1");
const nivel2Input = document.getElementById("nivel2");
const sugerencias1 = document.getElementById("sugerencias1");
const sugerencias2 = document.getElementById("sugerencias2");
const compararBtn = document.getElementById("compararBtn");
const resultado = document.getElementById("resultado");

let datos = [];
let conclusiones = [];
let nivelSeleccionado1 = null;
let nivelSeleccionado2 = null;
let graficoActual = null;

function normalizarTexto(texto) {
  return String(texto || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatearPorcentaje(valor) {
  return Number(valor).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " %";
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

function simplificarNivel(nivel) {
  const texto = String(nivel || "");

  if (texto.includes("Menos que primaria")) {
    return "Primaria o inferior";
  }

  if (texto.includes("primaria y primera etapa")) {
    return "Educación secundaria";
  }

  if (texto.includes("Segunda etapa")) {
    return "Educación postsecundaria no superior";
  }

  if (texto.includes("Educación superior")) {
    return "Educación superior";
  }

  return texto;
}

function prepararDatosParo(lista) {
  return lista
    .filter(item =>
      item &&
      item["Nivel.de.formación.alcanzado"] &&
      item["Sexo"] &&
      item["Periodo"] &&
      item["Total"] !== null &&
      item["Total"] !== undefined &&
      item["Total"] !== ""
    )
    .map(item => ({
      nivelOriginal: item["Nivel.de.formación.alcanzado"],
      nivel: simplificarNivel(item["Nivel.de.formación.alcanzado"]),
      sexo: item["Sexo"],
      periodo: item["Periodo"],
      tasa: parsearNumero(item["Total"])
    }))
    .filter(item =>
      item.nivel &&
      !Number.isNaN(item.tasa) &&
      normalizarTexto(item.sexo) === normalizarTexto("Ambos sexos")
    )
    .sort((a, b) => a.nivel.localeCompare(b.nivel, "es"));
}

function obtenerUltimoDatoPorNivel(lista) {
  const mapa = new Map();

  lista.forEach(item => {
    const actual = mapa.get(item.nivel);

    if (!actual || String(item.periodo) > String(actual.periodo)) {
      mapa.set(item.nivel, item);
    }
  });

  return [...mapa.values()].sort((a, b) => a.nivel.localeCompare(b.nivel, "es"));
}

function obtenerNivelesUnicos(lista) {
  const niveles = lista.map(item => item.nivel);
  return [...new Set(niveles)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarCoincidencias(texto) {
  const niveles = obtenerNivelesUnicos(datos);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return niveles;
  }

  return niveles.filter(nivel =>
    normalizarTexto(nivel).includes(textoNormalizado)
  );
}

function mostrarSugerencias(input, contenedor, coincidencias, numeroCampo) {
  contenedor.innerHTML = "";

  if (coincidencias.length === 0) {
    contenedor.classList.add("hidden");
    return;
  }

  coincidencias.forEach(nivel => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = nivel;

    div.addEventListener("click", () => {
      input.value = nivel;
      sugerencias1.classList.add("hidden");
      sugerencias2.classList.add("hidden");

      if (numeroCampo === 1) {
        nivelSeleccionado1 = datos.find(item => item.nivel === nivel);
      } else {
        nivelSeleccionado2 = datos.find(item => item.nivel === nivel);
      }
    });

    contenedor.appendChild(div);
  });

  contenedor.classList.remove("hidden");
}

function buscarNivelExacto(nombre) {
  return datos.find(item =>
    normalizarTexto(item.nivel) === normalizarTexto(nombre)
  );
}

function normalizarNivelParaConclusion(nivel) {
  const texto = normalizarTexto(nivel);

  if (
    texto.includes("educacion secundaria") ||
    texto === "secundaria"
  ) {
    return "secundaria";
  }

  if (
    texto.includes("educacion superior") ||
    texto === "superior"
  ) {
    return "educacion superior";
  }

  if (
    texto.includes("primaria") ||
    texto.includes("inferior")
  ) {
    return "primaria o inferior";
  }

  if (
    texto.includes("postsecundaria") ||
    texto.includes("no superior")
  ) {
    return "educacion postsecundaria no superior";
  }

  return texto;
}

function obtenerConclusionComparacion(nivelA, nivelB) {
  const a = normalizarNivelParaConclusion(nivelA);
  const b = normalizarNivelParaConclusion(nivelB);

  return conclusiones.find(item => {
    const partes = normalizarTexto(item.comparacion)
      .split(" vs ")
      .map(parte => normalizarNivelParaConclusion(parte));

    if (partes.length !== 2) return false;

    const [c1, c2] = partes;

    return (
      (c1 === a && c2 === b) ||
      (c1 === b && c2 === a)
    );
  });
}

function mostrarConclusion(a, b) {
  const conclusion = obtenerConclusionComparacion(a.nivel, b.nivel);

  const titulo = document.getElementById("tituloConclusion");
  const texto = document.getElementById("textoConclusion");

  if (conclusion) {
    titulo.textContent = conclusion.comparacion;
    texto.textContent = conclusion.conclusion;
  } else {
    titulo.textContent = `Conclusión: ${a.nivel} vs ${b.nivel}`;
    texto.textContent = "No hay una conclusión específica para esta comparación.";
  }

  const conclusionesComparacion = document.getElementById("conclusionesComparacion");

  conclusionesComparacion.classList.remove("hidden");
  conclusionesComparacion.classList.remove("animar-entrada");
  void conclusionesComparacion.offsetWidth;
  conclusionesComparacion.classList.add("animar-entrada");
}

function mostrarGraficoParo(a, b) {
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
      labels: [a.nivel, b.nivel],
      datasets: [
        {
          label: "Tasa de paro",
          data: [a.tasa, b.tasa],
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
              return ` ${formatearPorcentaje(context.raw)}`;
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
              return Number(value).toLocaleString("es-ES") + " %";
            }
          },
          grid: {
            color: "rgba(148, 163, 184, 0.12)"
          },
          beginAtZero: true
        }
      }
    }
  });
}

function mostrarComparacion(a, b) {
  document.getElementById("nombre1").textContent = a.nivel;
  document.getElementById("paro1").textContent = formatearPorcentaje(a.tasa);
  document.getElementById("sexo1").textContent = a.sexo;
  document.getElementById("periodo1").textContent = a.periodo;

  document.getElementById("nombre2").textContent = b.nivel;
  document.getElementById("paro2").textContent = formatearPorcentaje(b.tasa);
  document.getElementById("sexo2").textContent = b.sexo;
  document.getElementById("periodo2").textContent = b.periodo;

  const diferencia = a.tasa - b.tasa;

  if (diferencia > 0) {
    document.getElementById("diferencia").textContent =
      `${a.nivel} tiene una tasa de paro superior por ${formatearPorcentaje(Math.abs(diferencia))}.`;
  } else if (diferencia < 0) {
    document.getElementById("diferencia").textContent =
      `${b.nivel} tiene una tasa de paro superior por ${formatearPorcentaje(Math.abs(diferencia))}.`;
  } else {
    document.getElementById("diferencia").textContent =
      `Ambos niveles tienen la misma tasa de paro.`;
  }

  resultado.classList.remove("hidden");
  resultado.classList.remove("animar-entrada");
  void resultado.offsetWidth;
  resultado.classList.add("animar-entrada");

  mostrarConclusion(a, b);
  mostrarGraficoParo(a, b);
}

nivel1Input.addEventListener("focus", () => {
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(nivel1Input, sugerencias1, buscarCoincidencias(nivel1Input.value), 1);
});

nivel2Input.addEventListener("focus", () => {
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(nivel2Input, sugerencias2, buscarCoincidencias(nivel2Input.value), 2);
});

nivel1Input.addEventListener("input", () => {
  nivelSeleccionado1 = null;
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(nivel1Input, sugerencias1, buscarCoincidencias(nivel1Input.value), 1);
});

nivel2Input.addEventListener("input", () => {
  nivelSeleccionado2 = null;
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(nivel2Input, sugerencias2, buscarCoincidencias(nivel2Input.value), 2);
});

compararBtn.addEventListener("click", () => {
  const a = nivelSeleccionado1 || buscarNivelExacto(nivel1Input.value);
  const b = nivelSeleccionado2 || buscarNivelExacto(nivel2Input.value);

  if (!a || !b) {
    alert("Selecciona dos niveles de formación válidos de la lista.");
    return;
  }

  if (normalizarTexto(a.nivel) === normalizarTexto(b.nivel)) {
    alert("Selecciona dos niveles distintos.");
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
  fetch("./data/paro.json").then(res => res.json()),
  fetch("./data/conclusiones-paro.json").then(res => res.json())
])
  .then(([paroData, conclusionesData]) => {
    const datosPreparados = prepararDatosParo(paroData);
    datos = obtenerUltimoDatoPorNivel(datosPreparados);
    conclusiones = conclusionesData.conclusiones;

    console.log("Niveles de formación cargados:", datos.length);
    console.log("Datos preparados paro:", datos);
  })
  .catch(error => {
    console.error("Error cargando datos de paro:", error);
  });