const pais1Input = document.getElementById("pais1");
const pais2Input = document.getElementById("pais2");
const sugerencias1 = document.getElementById("sugerencias1");
const sugerencias2 = document.getElementById("sugerencias2");
const compararBtn = document.getElementById("compararBtn");
const resultado = document.getElementById("resultado");

let datos = [];
let conclusiones = [];
let paisSeleccionado1 = null;
let paisSeleccionado2 = null;
let graficoActual = null;

function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase();
}

function formatearEuros(valor) {
  return Number(valor).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " €";
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

function prepararDatosPaises(lista) {
  return lista
    .filter(item =>
      item &&
      item.geo &&
      item.TIME_PERIOD &&
      item.OBS_VALUE !== undefined &&
      item.OBS_VALUE !== null &&
      item.OBS_VALUE !== ""
    )
    .map(item => ({
      pais: item.geo,
      salario: parsearNumero(item.OBS_VALUE),
      periodo: item.TIME_PERIOD,
      moneda: item.currency || "Euro"
    }))
    .filter(item =>
      item.pais &&
      item.periodo &&
      !Number.isNaN(item.salario)
    )
    .sort((a, b) => {
      if (a.pais === b.pais) {
        return String(a.periodo).localeCompare(String(b.periodo));
      }

      return a.pais.localeCompare(b.pais, "es");
    });
}

function obtenerPaisesUnicos(lista) {
  const paises = lista.map(item => item.pais);
  return [...new Set(paises)].sort((a, b) => a.localeCompare(b, "es"));
}

function buscarCoincidencias(texto) {
  const paises = obtenerPaisesUnicos(datos);
  const textoNormalizado = normalizarTexto(texto);

  if (!textoNormalizado) {
    return paises;
  }

  return paises.filter(pais =>
    normalizarTexto(pais).includes(textoNormalizado)
  );
}

function mostrarSugerencias(input, contenedor, coincidencias, numeroCampo) {
  contenedor.innerHTML = "";

  if (coincidencias.length === 0) {
    contenedor.classList.add("hidden");
    return;
  }

  coincidencias.forEach(pais => {
    const div = document.createElement("div");
    div.className = "sugerencia-item";
    div.textContent = pais;

    div.addEventListener("click", () => {
      input.value = pais;
      sugerencias1.classList.add("hidden");
      sugerencias2.classList.add("hidden");

      if (numeroCampo === 1) {
        paisSeleccionado1 = { pais };
      } else {
        paisSeleccionado2 = { pais };
      }
    });

    contenedor.appendChild(div);
  });

  contenedor.classList.remove("hidden");
}

function buscarPaisExacto(nombre) {
  const existe = datos.some(item =>
    normalizarTexto(item.pais) === normalizarTexto(nombre)
  );

  if (!existe) return null;

  const registro = datos.find(item =>
    normalizarTexto(item.pais) === normalizarTexto(nombre)
  );

  return {
    pais: registro.pais
  };
}

function obtenerConclusionPorPais(pais) {
  return conclusiones.find(item =>
    normalizarTexto(item.pais) === normalizarTexto(pais)
  );
}

function mostrarConclusiones(a, b) {
  const conclusionA = obtenerConclusionPorPais(a.pais);
  const conclusionB = obtenerConclusionPorPais(b.pais);

  document.getElementById("tituloConclusion1").textContent = `Conclusión de ${a.pais}`;
  document.getElementById("textoConclusion1").textContent = conclusionA
    ? conclusionA.conclusion
    : "No hay conclusión disponible para este país.";

  document.getElementById("tituloConclusion2").textContent = `Conclusión de ${b.pais}`;
  document.getElementById("textoConclusion2").textContent = conclusionB
    ? conclusionB.conclusion
    : "No hay conclusión disponible para este país.";

  const conclusionesComparacion = document.getElementById("conclusionesComparacion");

  conclusionesComparacion.classList.remove("hidden");
  conclusionesComparacion.classList.remove("animar-entrada");
  void conclusionesComparacion.offsetWidth;
  conclusionesComparacion.classList.add("animar-entrada");
}

function mostrarGraficoPaises(paisA, paisB, periodosComunes, registrosA, registrosB) {
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

  const datosA = periodosComunes.map(periodo => {
    const registro = registrosA.find(item => item.periodo === periodo);
    return registro ? registro.salario : null;
  });

  const datosB = periodosComunes.map(periodo => {
    const registro = registrosB.find(item => item.periodo === periodo);
    return registro ? registro.salario : null;
  });

  graficoActual = new Chart(canvas, {
    type: "line",
    data: {
      labels: periodosComunes,
      datasets: [
        {
          label: paisA.pais,
          data: datosA,
          borderColor: "rgba(212, 175, 55, 1)",
          backgroundColor: "rgba(212, 175, 55, 0.18)",
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: false
        },
        {
          label: paisB.pais,
          data: datosB,
          borderColor: "rgba(139, 111, 42, 1)",
          backgroundColor: "rgba(139, 111, 42, 0.18)",
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.25,
          fill: false
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
              return ` ${context.dataset.label}: ${formatearEuros(context.raw)}`;
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

function mostrarTablaSemestral(paisA, paisB, periodosComunes, registrosA, registrosB) {
  const tabla = document.getElementById("tablaComparacionPaises");
  const tablaSemestral = document.getElementById("tablaSemestralPaises");

  if (!tabla || !tablaSemestral) {
    console.warn("No se encuentra el contenedor de la tabla semestral.");
    return;
  }

  tabla.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Semestre</th>
          <th>${paisA.pais}</th>
          <th>${paisB.pais}</th>
          <th>Diferencia</th>
          <th>Superior</th>
        </tr>
      </thead>
      <tbody>
        ${periodosComunes.map(periodo => {
          const datoA = registrosA.find(item => item.periodo === periodo);
          const datoB = registrosB.find(item => item.periodo === periodo);
          const diferencia = datoA.salario - datoB.salario;

          let superior = "";

          if (diferencia > 0) {
            superior = paisA.pais;
          } else if (diferencia < 0) {
            superior = paisB.pais;
          } else {
            superior = "Empate";
          }

          return `
            <tr>
              <td>${periodo}</td>
              <td>${formatearEuros(datoA.salario)}</td>
              <td>${formatearEuros(datoB.salario)}</td>
              <td>${formatearEuros(Math.abs(diferencia))}</td>
              <td>${superior}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  tablaSemestral.classList.remove("hidden");
  tablaSemestral.classList.remove("animar-entrada");
  void tablaSemestral.offsetWidth;
  tablaSemestral.classList.add("animar-entrada");
}

function mostrarComparacion(paisA, paisB) {
  const registrosA = datos.filter(item =>
    normalizarTexto(item.pais) === normalizarTexto(paisA.pais)
  );

  const registrosB = datos.filter(item =>
    normalizarTexto(item.pais) === normalizarTexto(paisB.pais)
  );

  const periodosComunes = registrosA
    .map(item => item.periodo)
    .filter(periodo => registrosB.some(item => item.periodo === periodo))
    .sort();

  if (periodosComunes.length === 0) {
    alert("No hay semestres comunes entre estos dos países.");
    return;
  }

  const ultimoPeriodo = periodosComunes[periodosComunes.length - 1];

  const ultimoA = registrosA.find(item => item.periodo === ultimoPeriodo);
  const ultimoB = registrosB.find(item => item.periodo === ultimoPeriodo);

  document.getElementById("nombre1").textContent = paisA.pais;
  document.getElementById("salario1").textContent = formatearEuros(ultimoA.salario);
  document.getElementById("periodo1").textContent = ultimoA.periodo;
  document.getElementById("moneda1").textContent = ultimoA.moneda;

  document.getElementById("nombre2").textContent = paisB.pais;
  document.getElementById("salario2").textContent = formatearEuros(ultimoB.salario);
  document.getElementById("periodo2").textContent = ultimoB.periodo;
  document.getElementById("moneda2").textContent = ultimoB.moneda;

  const diferenciaUltima = ultimoA.salario - ultimoB.salario;

  let textoResumen = "";

  if (diferenciaUltima > 0) {
    textoResumen = `En el último semestre común (${ultimoPeriodo}), ${paisA.pais} tiene un salario mínimo superior por ${formatearEuros(Math.abs(diferenciaUltima))}.`;
  } else if (diferenciaUltima < 0) {
    textoResumen = `En el último semestre común (${ultimoPeriodo}), ${paisB.pais} tiene un salario mínimo superior por ${formatearEuros(Math.abs(diferenciaUltima))}.`;
  } else {
    textoResumen = `En el último semestre común (${ultimoPeriodo}), ambos países tienen el mismo salario mínimo.`;
  }

  document.getElementById("resumenDiferencia").textContent = textoResumen;

  resultado.classList.remove("hidden");
  resultado.classList.remove("animar-entrada");
  void resultado.offsetWidth;
  resultado.classList.add("animar-entrada");

  mostrarGraficoPaises(paisA, paisB, periodosComunes, registrosA, registrosB);
  mostrarTablaSemestral(paisA, paisB, periodosComunes, registrosA, registrosB);
  mostrarConclusiones(paisA, paisB);
}

pais1Input.addEventListener("focus", () => {
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(pais1Input, sugerencias1, buscarCoincidencias(pais1Input.value), 1);
});

pais2Input.addEventListener("focus", () => {
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(pais2Input, sugerencias2, buscarCoincidencias(pais2Input.value), 2);
});

pais1Input.addEventListener("input", () => {
  paisSeleccionado1 = null;
  sugerencias2.classList.add("hidden");
  mostrarSugerencias(pais1Input, sugerencias1, buscarCoincidencias(pais1Input.value), 1);
});

pais2Input.addEventListener("input", () => {
  paisSeleccionado2 = null;
  sugerencias1.classList.add("hidden");
  mostrarSugerencias(pais2Input, sugerencias2, buscarCoincidencias(pais2Input.value), 2);
});

compararBtn.addEventListener("click", () => {
  const a = paisSeleccionado1 || buscarPaisExacto(pais1Input.value);
  const b = paisSeleccionado2 || buscarPaisExacto(pais2Input.value);

  if (!a || !b) {
    alert("Selecciona dos países válidos de la lista.");
    return;
  }

  if (normalizarTexto(a.pais) === normalizarTexto(b.pais)) {
    alert("Selecciona dos países distintos.");
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
  fetch("./data/paises.json").then(res => res.json()),
  fetch("./data/conclusiones-paises.json").then(res => res.json())
])
  .then(([paisesData, conclusionesData]) => {
    datos = prepararDatosPaises(paisesData);
    conclusiones = conclusionesData;
    console.log("Registros de países cargados:", datos.length);
    console.log("Países únicos cargados:", obtenerPaisesUnicos(datos).length);
  })
  .catch(error => {
    console.error("Error cargando los datos de países:", error);
  });