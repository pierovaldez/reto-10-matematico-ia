import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Calculator,
  ClipboardList,
  Database,
  Download,
  GraduationCap,
  Lock,
  Medal,
  Play,
  RotateCcw,
  School,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Tv,
  User,
  Users,
  Zap,
} from "lucide-react";
import { escucharPuntajes, guardarPuntajeFirebase, limpiarPuntajesFirebase } from "./firebase";

const LOGO_URL = "/reto-10-matematico/logo-republica-chile.png";
const CLAVE_GESTION = "RCH2026";

const DOCENTES = ["Oscar", "Jose Orlando", "Piero Valdez", "Cesar", "Gladys Lizana", "Erica Cossio"];
const GRADOS = ["1.º", "2.º", "3.º", "4.º", "5.º"];
const SECCIONES_POR_GRADO: Record<string, string[]> = {
  "1.º": ["A", "B", "C"],
  "2.º": ["A", "B", "C", "D"],
  "3.º": ["A", "B", "C", "D"],
  "4.º": ["A", "B"],
  "5.º": ["A", "B", "C"],
};
const TODAS_SECCIONES = ["A", "B", "C", "D"];
const ROLES = ["Estudiante", "Docente", "Dirección", "Modo Aula", "Configuración"];

const CONFIG_DEFAULT = {
  duracionReto: 60,
  puntosCorrecta: 10,
  bonoPrecision: 20,
  umbralPrecision: 80,
  bonoVelocidad: 10,
  umbralVelocidad: 10,
};

const NIVELES = [
  { id: 1, nombre: "Nivel 1", descripcion: "Cálculo directo" },
  { id: 2, nombre: "Nivel 2", descripcion: "Cálculo con dos pasos" },
  { id: 3, nombre: "Nivel 3", descripcion: "Problema corto" },
  { id: 4, nombre: "Nivel 4", descripcion: "Reto exigente" },
  { id: 5, nombre: "Nivel 5", descripcion: "Reto experto" },
];

const JUEGOS_POR_GRADO: Record<string, { id: string; nombre: string; descripcion: string }[]> = {
  "1.º": [
    { id: "operaciones", nombre: "Operaciones rápidas", descripcion: "Suma, resta, multiplicación y división." },
    { id: "tablas", nombre: "Tablas relámpago", descripcion: "Multiplicaciones básicas." },
    { id: "porcentajes-basicos", nombre: "Porcentajes básicos", descripcion: "10%, 20%, 25%, 50% y 75%." },
  ],
  "2.º": [
    { id: "enteros", nombre: "Enteros en acción", descripcion: "Operaciones con positivos y negativos." },
    { id: "fracciones", nombre: "Fracciones rápidas", descripcion: "Equivalencias y cálculo simple." },
    { id: "proporcionalidad", nombre: "Proporcionalidad express", descripcion: "Regla de tres." },
  ],
  "3.º": [
    { id: "porcentajes", nombre: "Desafío porcentual", descripcion: "Aumentos, descuentos y porcentajes." },
    { id: "potencias", nombre: "Potencias y raíces", descripcion: "Potencias y raíces exactas." },
    { id: "ecuaciones", nombre: "Ecuaciones rápidas", descripcion: "Ecuaciones lineales." },
  ],
  "4.º": [
    { id: "algebra", nombre: "Álgebra mental", descripcion: "Reducción de términos semejantes." },
    { id: "notacion", nombre: "Notación científica", descripcion: "Potencias de 10." },
    { id: "porcentaje-avanzado", nombre: "Porcentaje comercial", descripcion: "Descuentos, aumentos e IGV." },
  ],
  "5.º": [
    { id: "funciones", nombre: "Funciones veloces", descripcion: "Evaluación rápida de funciones." },
    { id: "estadistica", nombre: "Estadística express", descripcion: "Media y lectura de datos." },
    { id: "razonamiento", nombre: "Razonamiento numérico", descripcion: "Patrones y secuencias." },
  ],
};

type Registro = {
  id: string;
  fecha: string;
  timestamp: number;
  semana: string;
  estudiante: string;
  estudianteOriginal?: string;
  grado: string;
  seccion: string;
  docente: string;
  juego: string;
  juegoId: string;
  nivel: number;
  nivelNombre: string;
  puntajeBase: number;
  bonoPrecision: number;
  bonoVelocidad: number;
  puntaje: number;
  correctas: number;
  incorrectas: number;
  precision: number;
  respondidas: number;
};

type Ejercicio = { pregunta: string; respuesta: string; opciones: string[] };

const estilos = {
  input: "w-full rounded-xl bg-white text-slate-900 border border-yellow-300/50 p-3 outline-none placeholder:text-slate-500 shadow-sm",
  label: "text-sm text-slate-700 font-medium",
};

const storage = {
  ranking(): Registro[] {
    try {
      return JSON.parse(localStorage.getItem("rankingReto10") || "[]");
    } catch {
      return [];
    }
  },
  guardar(registro: Registro): Registro[] {
    const nuevo = [registro, ...this.ranking()];
    localStorage.setItem("rankingReto10", JSON.stringify(nuevo));
    return nuevo;
  },
  limpiar() {
    localStorage.removeItem("rankingReto10");
  },
  config() {
    try {
      return { ...CONFIG_DEFAULT, ...JSON.parse(localStorage.getItem("configReto10") || "{}") };
    } catch {
      return CONFIG_DEFAULT;
    }
  },
  guardarConfig(config: typeof CONFIG_DEFAULT) {
    localStorage.setItem("configReto10", JSON.stringify(config));
  },
};

function aleatorio(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function mezclar<T>(lista: T[]) {
  return [...lista].sort(() => Math.random() - 0.5);
}
function idSeguro() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random()}`;
}
function formatear(valor: number | string) {
  if (typeof valor === "number") return Number.isInteger(valor) ? String(valor) : String(Number(valor.toFixed(2)));
  return String(valor);
}
function crearOpciones(respuesta: number | string) {
  const correcta = formatear(respuesta);
  const opciones = [correcta];
  let intentos = 0;
  while (opciones.length < 4 && intentos < 50) {
    intentos += 1;
    let falsa = "";
    if (typeof respuesta === "number") {
      falsa = formatear(respuesta + aleatorio(-15, 15));
      if (falsa === correcta || Number(falsa) < 0) continue;
    } else {
      falsa = `${aleatorio(1, 9)}/${aleatorio(2, 12)}`;
    }
    if (!opciones.includes(falsa)) opciones.push(falsa);
  }
  while (opciones.length < 4) opciones.push(String(aleatorio(1, 100)));
  return mezclar(opciones);
}

function generarEjercicio(juegoId: string, nivel: number): Ejercicio {
  let a = 0, b = 0, c = 0;
  let respuesta: number | string = 0;
  let pregunta = "";

  if (nivel >= 4 && ["operaciones", "tablas", "enteros"].includes(juegoId)) {
    a = aleatorio(10, 90); b = aleatorio(2, 12); c = aleatorio(5, 30);
    respuesta = a + b * c; pregunta = `${a} + ${b} × ${c}`;
  } else if (nivel >= 3 && ["porcentajes", "porcentajes-basicos", "porcentaje-avanzado"].includes(juegoId)) {
    const base = aleatorio(20, 90) * 10;
    const descuento = [10, 15, 20, 25, 30][aleatorio(0, 4)];
    respuesta = base - (base * descuento) / 100;
    pregunta = `Una compra cuesta S/ ${base} y tiene ${descuento}% de descuento. ¿Cuánto se paga?`;
  } else if (nivel >= 5 && ["ecuaciones", "algebra", "funciones"].includes(juegoId)) {
    respuesta = aleatorio(2, 15); a = aleatorio(2, 8); b = aleatorio(1, 12);
    pregunta = `${a}(x + ${b}) = ${a * (Number(respuesta) + b)}. Hallar x`;
  } else if (juegoId === "operaciones") {
    const tipo = aleatorio(1, 4);
    if (tipo === 1) { a = aleatorio(20, 180); b = aleatorio(10, 90); respuesta = a + b; pregunta = `${a} + ${b}`; }
    else if (tipo === 2) { a = aleatorio(80, 250); b = aleatorio(10, a - 5); respuesta = a - b; pregunta = `${a} - ${b}`; }
    else if (tipo === 3) { a = aleatorio(6, 18); b = aleatorio(4, 15); respuesta = a * b; pregunta = `${a} × ${b}`; }
    else { b = aleatorio(2, 12); respuesta = aleatorio(4, 20); a = b * Number(respuesta); pregunta = `${a} ÷ ${b}`; }
  } else if (juegoId === "tablas") {
    a = aleatorio(2, nivel >= 2 ? 15 : 12); b = aleatorio(2, nivel >= 2 ? 15 : 12);
    respuesta = a * b; pregunta = `${a} × ${b}`;
  } else if (juegoId === "porcentajes-basicos") {
    a = [10, 20, 25, 50, 75][aleatorio(0, 4)]; b = aleatorio(4, 20) * 20;
    respuesta = (a * b) / 100; pregunta = `${a}% de ${b}`;
  } else if (juegoId === "enteros") {
    a = aleatorio(-30, 30); b = aleatorio(-30, 30);
    respuesta = nivel >= 2 ? a - b : a + b;
    pregunta = nivel >= 2 ? `${a} - (${b})` : `${a} + (${b})`;
  } else if (juegoId === "fracciones") {
    b = [2, 3, 4, 5, 6, 8, 10][aleatorio(0, 6)]; a = aleatorio(1, b - 1);
    respuesta = `${a}/${b}`; pregunta = `Fracción equivalente a ${a * 2}/${b * 2}`;
  } else if (juegoId === "proporcionalidad") {
    a = aleatorio(2, 9); b = aleatorio(3, 12); c = aleatorio(2, 8);
    respuesta = b * c; pregunta = `Si ${a} cuadernos cuestan S/ ${a * b}, ¿cuánto cuestan ${a * c}?`;
  } else if (juegoId === "porcentajes") {
    a = [5, 10, 15, 20, 25, 30, 40, 50][aleatorio(0, 7)]; b = aleatorio(10, 80) * 10;
    respuesta = (a * b) / 100; pregunta = `${a}% de ${b}`;
  } else if (juegoId === "potencias") {
    a = aleatorio(2, 9); b = aleatorio(2, nivel >= 3 ? 4 : 3);
    respuesta = Math.pow(a, b); pregunta = `${a}^${b}`;
  } else if (juegoId === "ecuaciones") {
    respuesta = aleatorio(2, 20); a = aleatorio(2, 9); b = aleatorio(1, 20);
    pregunta = `${a}x + ${b} = ${a * Number(respuesta) + b}. Hallar x`;
  } else if (juegoId === "algebra") {
    a = aleatorio(2, 9); b = aleatorio(2, 9); c = aleatorio(2, 9);
    respuesta = a + b - c; pregunta = `${a}x + ${b}x - ${c}x = ?x`;
  } else if (juegoId === "notacion") {
    a = aleatorio(2, 9); b = aleatorio(2, 5);
    respuesta = a * Math.pow(10, b); pregunta = `${a} × 10^${b}`;
  } else if (juegoId === "porcentaje-avanzado") {
    const base = aleatorio(20, 80) * 10; const descuento = [10, 20, 25, 30][aleatorio(0, 3)];
    respuesta = base - (base * descuento) / 100; pregunta = `Precio S/ ${base} con ${descuento}% de descuento`;
  } else if (juegoId === "funciones") {
    a = aleatorio(2, 9); b = aleatorio(1, 12); c = aleatorio(1, 10);
    respuesta = a * c + b; pregunta = `Si f(x) = ${a}x + ${b}, hallar f(${c})`;
  } else if (juegoId === "estadistica") {
    const x = aleatorio(5, 20); const y = aleatorio(5, 20); const z = aleatorio(5, 20);
    respuesta = (x + y + z) / 3; pregunta = `Media de ${x}, ${y} y ${z}`;
  } else {
    const inicio = aleatorio(2, 10); const salto = aleatorio(2, 8);
    respuesta = inicio + salto * 4; pregunta = `${inicio}, ${inicio + salto}, ${inicio + salto * 2}, ${inicio + salto * 3}, ...`;
  }
  return { pregunta, respuesta: formatear(respuesta), opciones: crearOpciones(respuesta) };
}

async function generarConIA({ grado, juego, nivel }: { grado: string; juego: any; nivel: number }) {
  try {
    const res = await fetch("/api/generar-ejercicio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grado, juego, nivel }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.pregunta || !data.respuesta || !Array.isArray(data.opciones)) return null;
    return data as Ejercicio;
  } catch {
    return null;
  }
}

function inicioSemana(fecha = new Date()) {
  const copia = new Date(fecha);
  const dia = copia.getDay();
  copia.setDate(copia.getDate() + (dia === 0 ? -6 : 1 - dia));
  copia.setHours(0, 0, 0, 0);
  return copia.getTime();
}
function calcularEstadisticas(registros: Registro[]) {
  const participaciones = registros.length;
  const puntajeTotal = registros.reduce((s, r) => s + Number(r.puntaje || 0), 0);
  const correctas = registros.reduce((s, r) => s + Number(r.correctas || 0), 0);
  const incorrectas = registros.reduce((s, r) => s + Number(r.incorrectas || 0), 0);
  return {
    participaciones,
    promedio: participaciones ? Math.round(puntajeTotal / participaciones) : 0,
    precision: correctas + incorrectas ? Math.round((correctas / (correctas + incorrectas)) * 100) : 0,
    puntajeTotal,
  };
}
function promedioPor(registros: Registro[], campo: keyof Registro) {
  const mapa: Record<string, { clave: string; total: number; cantidad: number }> = {};
  registros.forEach((r) => {
    const clave = String(r[campo] || "Sin dato");
    if (!mapa[clave]) mapa[clave] = { clave, total: 0, cantidad: 0 };
    mapa[clave].total += Number(r.puntaje || 0);
    mapa[clave].cantidad += 1;
  });
  return Object.values(mapa).map((x) => ({ ...x, promedio: Math.round(x.total / x.cantidad) })).sort((a, b) => b.promedio - a.promedio);
}
function rankingAula(registros: Registro[]) {
  const mapa: Record<string, { aula: string; total: number; cantidad: number }> = {};
  registros.forEach((r) => {
    const aula = `${r.grado} ${r.seccion}`;
    if (!mapa[aula]) mapa[aula] = { aula, total: 0, cantidad: 0 };
    mapa[aula].total += Number(r.puntaje || 0);
    mapa[aula].cantidad += 1;
  });
  return Object.values(mapa).map((x) => ({ ...x, promedio: Math.round(x.total / x.cantidad) })).sort((a, b) => b.promedio - a.promedio);
}
function rankingMejora(registros: Registro[]) {
  const mapa: Record<string, any> = {};
  registros.slice().sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0)).forEach((r) => {
    const clave = `${r.estudiante}-${r.grado}-${r.seccion}`;
    if (!mapa[clave]) mapa[clave] = { estudiante: r.estudiante, grado: r.grado, seccion: r.seccion, primero: Number(r.puntaje || 0), ultimo: Number(r.puntaje || 0), intentos: 0 };
    mapa[clave].ultimo = Number(r.puntaje || 0);
    mapa[clave].intentos += 1;
  });
  return Object.values(mapa).filter((x) => x.intentos >= 2).map((x) => ({ ...x, mejora: x.ultimo - x.primero })).sort((a, b) => b.mejora - a.mejora);
}
function diagnostico(registro?: Registro) {
  if (!registro) return { fortaleza: "Sin datos todavía.", dificultad: "Aún no hay intento registrado.", recomendacion: "Realiza un primer reto." };
  const precision = Number(registro.precision || 0);
  const respondidas = Number(registro.respondidas || 0);
  return {
    fortaleza: precision >= 80 ? "Buena precisión en el cálculo." : respondidas >= 10 ? "Buen ritmo de respuesta." : "Está iniciando su práctica.",
    dificultad: precision < 60 ? "Debe reforzar el tipo de cálculo trabajado." : respondidas < 8 ? "Necesita aumentar velocidad y confianza." : "No presenta dificultad crítica.",
    recomendacion: precision < 60 ? "Practicar niveles 1 y 2." : respondidas < 8 ? "Hacer retos cortos de cálculo básico." : "Puede avanzar al siguiente nivel.",
  };
}
function logros(registro: Registro | undefined, historial: Registro[]) {
  if (!registro) return [];
  const lista: { nombre: string; texto: string; icono: any }[] = [];
  if (Number(registro.respondidas || 0) > 10) lista.push({ nombre: "Mente rápida", texto: "Respondió más de 10 preguntas.", icono: Zap });
  if (Number(registro.precision || 0) > 80) lista.push({ nombre: "Precisión matemática", texto: "Superó el 80% de precisión.", icono: Target });
  if (historial.length >= 3) lista.push({ nombre: "Constancia", texto: "Tiene 3 o más participaciones.", icono: Star });
  if (historial.length >= 2 && Number(historial[0].puntaje || 0) > Number(historial[historial.length - 1].puntaje || 0)) lista.push({ nombre: "Superación", texto: "Mejoró respecto a su primer intento.", icono: TrendingUp });
  return lista;
}

function limpiarCeldaCSV(valor: any) {
  const texto = String(valor ?? "");
  return '"' + texto.replace(/"/g, '""') + '"';
}
function descargarArchivo(nombreArchivo: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.style.display = "none";
  document.body.appendChild(enlace);
  enlace.click();
  setTimeout(() => {
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }, 100);
}
function exportarCSV(datos: Registro[]) {
  const columnas = ["fecha", "semana", "estudiante", "grado", "seccion", "docente", "juego", "nivelNombre", "puntaje", "correctas", "incorrectas", "precision", "respondidas"];
  const filas = datos.map((registro) => columnas.map((columna) => limpiarCeldaCSV((registro as any)[columna])).join(","));
  const contenido = [columnas.join(","), ...filas].join(String.fromCharCode(10));
  descargarArchivo("ranking_reto_10_matematico.csv", contenido, "text/csv;charset=utf-8;");
}
function exportarExcel(datos: Registro[]) {
  const columnas = ["Puesto", "Fecha", "Semana", "Estudiante", "Grado", "Sección", "Docente", "Juego", "Nivel", "Puntaje", "Correctas", "Incorrectas", "Precisión", "Respondidas"];
  const filas = datos.map((r, i) => [i + 1, r.fecha, r.semana, r.estudiante, r.grado, r.seccion, r.docente, r.juego, r.nivelNombre, r.puntaje, r.correctas, r.incorrectas, r.precision, r.respondidas]);
  let html = "<html><head><meta charset='UTF-8'></head><body>";
  html += "<h2>Reto 10 Matemático - I.E. República de Chile</h2>";
  html += "<table border='1'><thead><tr>";
  columnas.forEach((c) => { html += "<th>" + c + "</th>"; });
  html += "</tr></thead><tbody>";
  filas.forEach((fila) => { html += "<tr>"; fila.forEach((celda) => { html += "<td>" + String(celda ?? "") + "</td>"; }); html += "</tr>"; });
  html += "</tbody></table></body></html>";
  descargarArchivo("ranking_reto_10_matematico.xls", html, "application/vnd.ms-excel;charset=utf-8;");
}
function top3PorGrado(registros: Registro[]) {
  return GRADOS.map((grado) => ({
    grado,
    estudiantes: registros.filter((r) => r.grado === grado).sort((a, b) => b.puntaje - a.puntaje).slice(0, 3),
  }));
}
function generarResumenAutomatico({ registros, aulaCampeona, mejoraTop }: { registros: Registro[]; aulaCampeona: any; mejoraTop: any }) {
  const est = calcularEstadisticas(registros);
  const docenteTop = promedioPor(registros, "docente")[0];
  const gradoTop = promedioPor(registros, "grado")[0];
  if (registros.length === 0) return "Aún no hay datos suficientes para generar un resumen institucional.";
  const partes = [];
  partes.push(`Participaron ${est.participaciones} registros con un promedio general de ${est.promedio} puntos y una precisión aproximada de ${est.precision}%.`);
  if (aulaCampeona) partes.push(`La sección campeona es ${aulaCampeona.aula}, con un promedio de ${aulaCampeona.promedio} puntos.`);
  if (gradoTop) partes.push(`El grado con mejor promedio es ${gradoTop.clave}, con ${gradoTop.promedio} puntos.`);
  if (docenteTop) partes.push(`El docente con mejor promedio registrado es ${docenteTop.clave}, con ${docenteTop.promedio} puntos.`);
  if (mejoraTop) partes.push(`La mayor mejora corresponde a ${mejoraTop.estudiante}, con una mejora de +${mejoraTop.mejora} puntos.`);
  partes.push("Recomendación: revisar las aulas con baja participación y reforzar los juegos donde los estudiantes presenten menor precisión.");
  return partes.join(" ");
}
function exportarReporteTexto({ resumen, aulaCampeona, topGrado }: { resumen: string; aulaCampeona: any; topGrado: any[] }) {
  const lineas = ["REPORTE INSTITUCIONAL - RETO 10 MATEMÁTICO", "I.E. República de Chile", "", "RESUMEN AUTOMÁTICO:", resumen || "Sin resumen disponible.", ""];
  lineas.push(aulaCampeona ? `SECCIÓN CAMPEONA: ${aulaCampeona.aula} - Promedio: ${aulaCampeona.promedio} puntos` : "SECCIÓN CAMPEONA: Sin datos.");
  lineas.push("", "TOP 3 POR GRADO:");
  topGrado.forEach((grupo) => {
    lineas.push(`${grupo.grado}:`);
    if (!grupo.estudiantes || grupo.estudiantes.length === 0) lineas.push("  Sin registros.");
    grupo.estudiantes?.forEach((e: Registro, i: number) => lineas.push(`  ${i + 1}. ${e.estudiante} - ${e.puntaje} puntos - Sección ${e.seccion}`));
  });
  descargarArchivo("reporte_institucional_reto_10.txt", lineas.join(String.fromCharCode(10)), "text/plain;charset=utf-8;");
}

function normalizarNombre(texto: string) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zñ\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function distanciaLevenshtein(a: string, b: string) {
  const matriz = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(matriz[i - 1][j] + 1, matriz[i][j - 1] + 1, matriz[i - 1][j - 1] + costo);
    }
  }
  return matriz[a.length][b.length];
}
function similitudNombre(a: string, b: string) {
  const na = normalizarNombre(a);
  const nb = normalizarNombre(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const distancia = distanciaLevenshtein(na, nb);
  return 1 - distancia / Math.max(na.length, nb.length);
}
function buscarNombreParecido(nombre: string, grado: string, seccion: string, registros: Registro[]) {
  const candidatos = Array.from(new Set(registros.filter((r) => r.grado === grado && r.seccion === seccion).map((r) => r.estudiante).filter(Boolean)));
  let mejor: { nombre: string; score: number } | null = null;
  candidatos.forEach((candidato) => {
    const score = similitudNombre(nombre, candidato);
    if (score >= 0.74 && normalizarNombre(nombre) !== normalizarNombre(candidato)) {
      if (!mejor || score > mejor.score) mejor = { nombre: candidato, score };
    }
  });
  return mejor;
}
function normalizarRegistrosParecidos(registros: Registro[]) {
  const canonicos: { claveGrupo: string; nombre: string }[] = [];
  const normalizados: Registro[] = [];
  registros.slice().sort((a, b) => a.timestamp - b.timestamp).forEach((registro) => {
    const claveGrupo = `${registro.grado}-${registro.seccion}`;
    const nombreActual = registro.estudiante || "Estudiante sin nombre";
    let encontrado: { nombre: string; score: number } | null = null;
    canonicos.forEach((item) => {
      if (item.claveGrupo !== claveGrupo) return;
      const score = similitudNombre(nombreActual, item.nombre);
      if (score >= 0.74 && (!encontrado || score > encontrado.score)) encontrado = { nombre: item.nombre, score };
    });
    if (encontrado) normalizados.push({ ...registro, estudianteOriginal: registro.estudiante, estudiante: encontrado.nombre });
    else {
      canonicos.push({ claveGrupo, nombre: nombreActual });
      normalizados.push({ ...registro, estudianteOriginal: registro.estudiante, estudiante: nombreActual });
    }
  });
  return normalizados.sort((a, b) => b.timestamp - a.timestamp);
}

function Logo() {
  const [error, setError] = useState(false);
  if (error) return <div className="h-24 w-24 rounded-2xl bg-white border border-yellow-300/50 flex items-center justify-center shadow-lg"><School className="text-[#c62828]" size={42} /></div>;
  return <img src={LOGO_URL} alt="Logo" className="h-24 w-24 object-contain drop-shadow-2xl" onError={() => setError(true)} />;
}

export default function App() {
  const [rol, setRol] = useState("Estudiante");
  const [autorizado, setAutorizado] = useState(false);
  const [rolPendiente, setRolPendiente] = useState<string | null>(null);
  const [claveIngresada, setClaveIngresada] = useState("");
  const [errorClave, setErrorClave] = useState("");
  const [pantalla, setPantalla] = useState("registro");
  const [form, setForm] = useState({ grado: "1.º", seccion: "A", apellidosNombres: "", docente: "Piero Valdez" });
  const [nivel, setNivel] = useState(1);
  const [config, setConfig] = useState(CONFIG_DEFAULT);
  const [usarIA, setUsarIA] = useState(false);
  const [juego, setJuego] = useState<any>(null);
  const [ejercicio, setEjercicio] = useState<Ejercicio | null>(null);
  const [preguntaN, setPreguntaN] = useState(1);
  const [puntaje, setPuntaje] = useState(0);
  const [correctas, setCorrectas] = useState(0);
  const [incorrectas, setIncorrectas] = useState(0);
  const [tiempo, setTiempo] = useState(60);
  const [ranking, setRanking] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("Todos");
  const [filtroSeccion, setFiltroSeccion] = useState("Todas");
  const [filtroDocente, setFiltroDocente] = useState("Todos");

  const juegos = useMemo(() => JUEGOS_POR_GRADO[form.grado] || [], [form.grado]);
  const secciones = useMemo(() => SECCIONES_POR_GRADO[form.grado] || ["A"], [form.grado]);

  useEffect(() => {
    const cfg = storage.config();
    setConfig(cfg);
    setTiempo(Number(cfg.duracionReto || 60));

    // Carga inmediata desde el navegador mientras Firebase responde.
    setRanking(storage.ranking());

    // Luego escucha Firebase en tiempo real. Si no hay internet o reglas activas,
    // el sistema conserva el respaldo local.
    const unsubscribe = escucharPuntajes(
      (registros) => {
        const datos = registros as Registro[];
        setRanking(datos);
        localStorage.setItem("rankingReto10", JSON.stringify(datos));
      },
      (error) => {
        console.error("No se pudo leer Firebase. Se usará respaldo local.", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (pantalla !== "juego") return;
    if (tiempo <= 0) {
      finalizarJuego();
      return;
    }
    const t = setInterval(() => setTiempo((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [pantalla, tiempo]);

  function cambiarRol(nuevoRol: string) {
    if (["Docente", "Dirección"].includes(nuevoRol) && !autorizado) {
      setRolPendiente(nuevoRol);
      setClaveIngresada("");
      setErrorClave("");
      return;
    }
    setRol(nuevoRol);
  }
  function verificarClaveGestion() {
    if (claveIngresada.trim() !== CLAVE_GESTION) {
      setErrorClave("Contraseña incorrecta. Inténtelo nuevamente.");
      return;
    }
    setAutorizado(true);
    setRol(rolPendiente || "Docente");
    setRolPendiente(null);
    setClaveIngresada("");
    setErrorClave("");
  }
  function cambiar(campo: string, valor: string) {
    setForm((prev) => campo === "grado" ? { ...prev, grado: valor, seccion: (SECCIONES_POR_GRADO[valor] || ["A"])[0] } : { ...prev, [campo]: valor });
  }
  async function nuevoEjercicio(j = juego) {
    if (!j) return;
    setCargando(true);
    let e = null;
    if (usarIA) e = await generarConIA({ grado: form.grado, juego: j, nivel });
    if (!e) e = generarEjercicio(j.id, nivel);
    setEjercicio(e);
    setCargando(false);
  }
  async function iniciar(j: any) {
    const parecido = buscarNombreParecido(form.apellidosNombres, form.grado, form.seccion, ranking);
    if (parecido) {
      const usarExistente = window.confirm(`Existe un nombre parecido registrado: ${parecido.nombre}. ¿Deseas usar ese nombre para evitar duplicados?`);
      if (usarExistente) setForm((prev) => ({ ...prev, apellidosNombres: parecido.nombre }));
    }
    setJuego(j);
    setPreguntaN(1);
    setPuntaje(0);
    setCorrectas(0);
    setIncorrectas(0);
    setTiempo(Number(config.duracionReto || 60));
    setPantalla("juego");
    await nuevoEjercicio(j);
  }
  async function responder(opcion: string) {
    if (!ejercicio) return;
    if (String(opcion).trim().toLowerCase() === String(ejercicio.respuesta).trim().toLowerCase()) {
      setPuntaje((p) => p + Number(config.puntosCorrecta || 10));
      setCorrectas((c) => c + 1);
    } else setIncorrectas((i) => i + 1);
    setPreguntaN((n) => n + 1);
    await nuevoEjercicio();
  }
  function finalizarJuego() {
    if (pantalla === "resultado") return;
    const respondidas = correctas + incorrectas;
    const precision = respondidas ? Math.round((correctas / respondidas) * 100) : 0;
    const bonoPrecision = precision > Number(config.umbralPrecision || 80) ? Number(config.bonoPrecision || 20) : 0;
    const bonoVelocidad = respondidas > Number(config.umbralVelocidad || 10) ? Number(config.bonoVelocidad || 10) : 0;
    const parecido = buscarNombreParecido(form.apellidosNombres, form.grado, form.seccion, ranking);
    const nombreFinal = parecido ? parecido.nombre : (form.apellidosNombres.trim() || "Estudiante sin nombre");
    const registro: Registro = {
      id: idSeguro(), fecha: new Date().toLocaleString("es-PE"), timestamp: Date.now(), semana: new Date(inicioSemana()).toLocaleDateString("es-PE"),
      estudiante: nombreFinal, grado: form.grado, seccion: form.seccion, docente: form.docente, juego: juego?.nombre || "Juego", juegoId: juego?.id || "juego", nivel,
      nivelNombre: NIVELES.find((n) => n.id === nivel)?.nombre || `Nivel ${nivel}`,
      puntajeBase: puntaje, bonoPrecision, bonoVelocidad, puntaje: puntaje + bonoPrecision + bonoVelocidad, correctas, incorrectas, precision, respondidas,
    };
    const actualizadoLocal = storage.guardar(registro);
    setRanking(actualizadoLocal);
    guardarPuntajeFirebase(registro).catch((error) => {
      console.error("No se pudo guardar en Firebase. Quedó guardado localmente.", error);
    });
    setPantalla("resultado");
  }
  function reiniciar() {
    setPantalla("registro"); setJuego(null); setEjercicio(null); setPreguntaN(1); setPuntaje(0); setCorrectas(0); setIncorrectas(0); setTiempo(Number(config.duracionReto || 60));
  }

  const rankingNormalizado = normalizarRegistrosParecidos(ranking);
  const rankingFiltrado = rankingNormalizado.filter((r) => `${r.estudiante} ${r.docente} ${r.juego}`.toLowerCase().includes(busqueda.toLowerCase()) && (filtroGrado === "Todos" || r.grado === filtroGrado) && (filtroSeccion === "Todas" || r.seccion === filtroSeccion) && (filtroDocente === "Todos" || r.docente === filtroDocente));
  const historial = rankingNormalizado.filter((r) => r.estudiante.toLowerCase() === form.apellidosNombres.trim().toLowerCase() && r.grado === form.grado && r.seccion === form.seccion).sort((a, b) => b.timestamp - a.timestamp);
  const ultimo = historial[0];
  const diag = diagnostico(ultimo);
  const insignias = logros(ultimo, historial);
  const est = calcularEstadisticas(rankingFiltrado);
  const topGeneral = [...rankingFiltrado].sort((a, b) => b.puntaje - a.puntaje).slice(0, 30);
  const semanal = rankingFiltrado.filter((r) => Number(r.timestamp || 0) >= inicioSemana()).sort((a, b) => b.puntaje - a.puntaje).slice(0, 10);
  const porAula = rankingAula(rankingFiltrado).slice(0, 10);
  const porMejora = rankingMejora(rankingFiltrado).slice(0, 10);
  const topAula = rankingNormalizado.filter((r) => r.grado === form.grado && r.seccion === form.seccion).sort((a, b) => b.puntaje - a.puntaje).slice(0, 5);
  const aulaCampeona = rankingAula(rankingFiltrado)[0];
  const mejorMejora = porMejora[0];
  const topGrado = top3PorGrado(rankingFiltrado);
  const resumenAuto = generarResumenAutomatico({ registros: rankingFiltrado, aulaCampeona, mejoraTop: mejorMejora });

  return (
    <div className="min-h-screen p-4 md:p-8 text-white bg-gradient-to-br from-[#0b2c6b] via-[#123d8d] to-[#8b1e2d]">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />
        <RoleBar rol={rol} cambiarRol={cambiarRol} />
        {rolPendiente && <AccessPanel rolPendiente={rolPendiente} claveIngresada={claveIngresada} setClaveIngresada={setClaveIngresada} verificarClaveGestion={verificarClaveGestion} cancelar={() => setRolPendiente(null)} errorClave={errorClave} />}
        {rol === "Estudiante" && pantalla === "registro" && <StudentRegister form={form} cambiar={cambiar} secciones={secciones} usarIA={usarIA} setUsarIA={setUsarIA} nivel={nivel} setNivel={setNivel} juegos={juegos} iniciar={iniciar} />}
        {rol === "Estudiante" && pantalla === "juego" && <GameScreen form={form} juego={juego} nivel={nivel} tiempo={tiempo} puntaje={puntaje} preguntaN={preguntaN} cargando={cargando} ejercicio={ejercicio} responder={responder} correctas={correctas} incorrectas={incorrectas} finalizarJuego={finalizarJuego} />}
        {rol === "Estudiante" && pantalla === "resultado" && <ResultScreen form={form} juego={juego} ultimo={ultimo} diag={diag} insignias={insignias} reiniciar={reiniciar} />}
        {rol === "Modo Aula" && <ClassroomMode form={form} cambiar={cambiar} secciones={secciones} topAula={topAula} />}
        {rol === "Configuración" && <ConfigPanel config={config} setConfig={setConfig} />}
        {(rol === "Docente" || rol === "Dirección") && <ManagementPanel est={est} busqueda={busqueda} setBusqueda={setBusqueda} filtroGrado={filtroGrado} setFiltroGrado={setFiltroGrado} filtroSeccion={filtroSeccion} setFiltroSeccion={setFiltroSeccion} filtroDocente={filtroDocente} setFiltroDocente={setFiltroDocente} rankingFiltrado={rankingFiltrado} semanal={semanal} porAula={porAula} porMejora={porMejora} aulaCampeona={aulaCampeona} topGrado={topGrado} resumenAuto={resumenAuto} mejorMejora={mejorMejora} />}
        <RankingTable data={topGeneral} rankingFiltrado={rankingFiltrado} resumenAuto={resumenAuto} aulaCampeona={aulaCampeona} topGrado={topGrado} puedeLimpiar={autorizado && (rol === "Docente" || rol === "Dirección")} limpiar={() => {
          if (!window.confirm("¿Está seguro de que desea limpiar todo el ranking? Esta acción no se puede deshacer.")) return;
          storage.limpiar();
          setRanking([]);
          limpiarPuntajesFirebase().catch((error) => {
            console.error("No se pudo limpiar Firebase.", error);
            alert("Se limpió el ranking local, pero no se pudo limpiar Firebase. Revise las reglas de Firestore.");
          });
        }} />
      </div>
    </div>
  );
}

function Header() {
  return <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4"><div className="flex justify-center"><Logo /></div><div className="inline-flex items-center gap-2 bg-white text-slate-900 border border-yellow-300/50 rounded-full px-4 py-2 text-sm shadow-md"><School size={18} /> I.E. República de Chile - Lince</div><h1 className="text-3xl md:text-6xl font-bold drop-shadow-lg text-white">Reto 10 Matemático</h1><p className="text-blue-50 max-w-3xl mx-auto">Plataforma institucional para practicar cálculo, registrar puntajes y motivar la competencia sana entre aulas.</p></motion.header>;
}
function PanelCard({ children, className = "", padding = "p-6" }: any) { return <div className={`bg-white text-slate-900 border border-yellow-300/40 shadow-2xl rounded-2xl ${className}`}><div className={padding}>{children}</div></div>; }
function SectionTitle({ icon, title }: any) { return <div className="flex items-center gap-3 mb-5">{icon}<h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>; }
function RoleBar({ rol, cambiarRol }: any) { return <PanelCard padding="p-4"><div className="flex flex-col md:flex-row gap-3 md:items-center justify-between"><div className="flex flex-wrap gap-2">{ROLES.map((r) => <RoleButton key={r} rol={r} activo={rol === r} onClick={() => cambiarRol(r)} />)}</div><div className="flex items-center gap-2 text-sm text-slate-700 bg-yellow-50 border border-yellow-300/40 rounded-xl px-3 py-2"><Database size={16} /> Guardado local. Preparado para Firebase.</div></div></PanelCard>; }
function RoleButton({ rol, activo, onClick }: any) { const icons: any = { Estudiante: User, Docente: GraduationCap, Dirección: ShieldCheck, "Modo Aula": Tv, Configuración: Settings }; const Icon = icons[rol]; const cn = activo ? "bg-[#c62828] hover:bg-[#e53935] text-white rounded-xl px-4 py-2 flex items-center" : "bg-white hover:bg-yellow-50 text-slate-900 rounded-xl border border-yellow-300/40 shadow-sm px-4 py-2 flex items-center"; return <button onClick={onClick} className={cn}>{Icon && <Icon size={18} className="mr-2" />}{rol}</button>; }
function TextField({ label, value, onChange, placeholder = "", className = "" }: any) { return <label className={`space-y-2 ${className}`}>{label && <span className={estilos.label}>{label}</span>}<input className={estilos.input} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function NumberField({ label, value, onChange }: any) { return <label className="space-y-2"><span className={estilos.label}>{label}</span><input type="number" className={estilos.input} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function SelectField({ label, value, options, onChange, className = "" }: any) { return <label className={`space-y-2 ${className}`}>{label && <span className={estilos.label}>{label}</span>}<select className={estilos.input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function DataBox({ value, label }: any) { return <div className="bg-white rounded-2xl p-4 border border-yellow-300/40 shadow-sm text-slate-900"><div className="text-3xl font-bold text-[#c62828]">{value}</div><div className="text-sm text-slate-600">{label}</div></div>; }
function Badge({ icon, text }: any) { return <div className="bg-white text-slate-900 rounded-2xl px-4 py-3 flex items-center gap-2 border border-yellow-300/40 shadow-sm">{icon} {text}</div>; }
function InfoBox({ title, icon, children }: any) { return <div className="bg-white text-slate-900 border border-yellow-300/40 rounded-2xl shadow-sm p-5 space-y-3"><h3 className="font-bold text-xl flex items-center gap-2">{icon} {title}</h3>{children}</div>; }

function AccessPanel({ rolPendiente, claveIngresada, setClaveIngresada, verificarClaveGestion, cancelar, errorClave }: any) {
  return <PanelCard><div className="max-w-md mx-auto space-y-4 text-center"><ShieldCheck className="mx-auto text-[#c62828]" size={54} /><h2 className="text-2xl font-bold text-slate-900">Acceso restringido</h2><p className="text-slate-700">Ingrese la contraseña para acceder al panel de {rolPendiente}.</p><input type="password" className={estilos.input} placeholder="Contraseña" value={claveIngresada} onChange={(e) => setClaveIngresada(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") verificarClaveGestion(); }} autoFocus />{errorClave && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{errorClave}</p>}<div className="flex justify-center gap-3"><button onClick={verificarClaveGestion} className="rounded-xl bg-[#c62828] hover:bg-[#e53935] text-white px-4 py-2">Ingresar</button><button onClick={cancelar} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2">Cancelar</button></div></div></PanelCard>;
}
function StudentRegister({ form, cambiar, secciones, usarIA, setUsarIA, nivel, setNivel, juegos, iniciar }: any) {
  return <div className="grid lg:grid-cols-3 gap-6"><PanelCard className="lg:col-span-2"><SectionTitle icon={<User className="text-[#c62828]" />} title="Ingreso del estudiante" /><div className="grid md:grid-cols-2 gap-4"><SelectField label="Grado" value={form.grado} options={GRADOS} onChange={(v) => cambiar("grado", v)} /><SelectField label="Sección" value={form.seccion} options={secciones} onChange={(v) => cambiar("seccion", v)} /><TextField className="md:col-span-2" label="Apellidos y nombres" value={form.apellidosNombres} placeholder="Ejemplo: Valdez Yánac, Piero Raphael" onChange={(v) => cambiar("apellidosNombres", v)} /><SelectField className="md:col-span-2" label="Docente" value={form.docente} options={DOCENTES} onChange={(v) => cambiar("docente", v)} /></div><div className="bg-white text-slate-900 border border-yellow-300/40 rounded-2xl shadow-sm p-4 space-y-3 mt-5"><div className="flex items-center gap-2 font-semibold text-slate-900"><Sparkles size={18} className="text-yellow-600" /> Ejercicios con IA mediante backend</div><p className="text-sm text-slate-700">Si no existe backend, el sistema usará ejercicios locales automáticos.</p><button className={usarIA ? "bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 flex items-center" : "bg-[#123d8d] hover:bg-[#0b2c6b] text-white rounded-xl px-4 py-2 flex items-center"} onClick={() => setUsarIA(!usarIA)}><Lock size={18} className="mr-2" /> {usarIA ? "IA activada" : "IA desactivada"}</button></div></PanelCard><PanelCard><SectionTitle icon={<Calculator className="text-[#c62828]" />} title={`Juegos para ${form.grado}`} /><div className="bg-white text-slate-900 border border-yellow-300/40 rounded-2xl shadow-sm p-4 space-y-2 mb-4"><div className="font-semibold text-slate-900">Nivel de dificultad</div>{NIVELES.map((n) => <button key={n.id} onClick={() => setNivel(n.id)} className={nivel === n.id ? "w-full text-left rounded-xl p-3 bg-[#c62828] text-white" : "w-full text-left rounded-xl p-3 bg-white hover:bg-yellow-50 text-slate-900 border border-yellow-300/40"}><b className="block">{n.nombre}</b><span className={nivel === n.id ? "block text-sm text-red-50" : "block text-sm text-slate-600"}>{n.descripcion}</span></button>)}</div><div className="space-y-3">{juegos.map((j) => <button key={j.id} onClick={() => iniciar(j)} disabled={!form.apellidosNombres.trim()} className="w-full text-left bg-white hover:bg-yellow-50 disabled:opacity-40 border border-yellow-300/40 rounded-2xl p-4 transition text-slate-900 shadow-sm"><div className="font-bold">{j.nombre}</div><div className="text-sm text-slate-600">{j.descripcion}</div></button>)}</div>{!form.apellidosNombres.trim() && <p className="text-sm text-slate-700 bg-yellow-50 border border-yellow-300/40 rounded-xl p-3 mt-3">Primero escribe apellidos y nombres.</p>}</PanelCard></div>;
}
function GameScreen({ form, juego, nivel, tiempo, puntaje, preguntaN, cargando, ejercicio, responder, correctas, incorrectas, finalizarJuego }: any) {
  return <PanelCard><div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"><div><h2 className="text-2xl md:text-3xl font-bold text-slate-900">{juego?.nombre}</h2><p className="text-slate-700">{form.apellidosNombres} · {form.grado} {form.seccion} · Prof. {form.docente} · {NIVELES.find((n) => n.id === nivel)?.nombre}</p></div><div className="flex gap-3"><Badge icon={<Timer className="text-red-600" />} text={`${tiempo}s`} /><Badge icon={<Trophy className="text-yellow-600" />} text={`${puntaje} pts`} /></div></div><div className="bg-white rounded-2xl p-6 md:p-10 text-center border border-yellow-300/40 shadow-inner mb-6"><p className="text-slate-700 mb-2">Pregunta {preguntaN}</p><div className="text-3xl md:text-5xl font-bold text-slate-900">{cargando ? "Generando ejercicio..." : ejercicio?.pregunta}</div></div><div className="grid md:grid-cols-2 gap-4">{ejercicio?.opciones?.map((opcion, i) => <button key={`${opcion}-${i}`} disabled={cargando} onClick={() => responder(opcion)} className="h-auto p-5 rounded-2xl text-xl bg-[#c62828] hover:bg-[#e53935] text-white border border-yellow-300/20">{opcion}</button>)}</div><div className="flex justify-between items-center text-sm text-slate-700 mt-5"><span>Correctas: {correctas} · Incorrectas: {incorrectas}</span><button onClick={finalizarJuego} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2">Finalizar</button></div></PanelCard>;
}
function ResultScreen({ form, juego, ultimo, diag, insignias, reiniciar }: any) {
  return <PanelCard><div className="text-center space-y-5"><Medal className="mx-auto text-yellow-600" size={72} /><h2 className="text-3xl font-bold text-slate-900">Resultado guardado</h2><p className="text-slate-700">{form.apellidosNombres} obtuvo {ultimo?.puntaje ?? 0} puntos en {juego?.nombre}.</p><div className="grid md:grid-cols-4 gap-4"><DataBox value={ultimo?.puntaje ?? 0} label="Puntaje final" /><DataBox value={ultimo?.puntajeBase ?? 0} label="Puntaje base" /><DataBox value={`${ultimo?.precision ?? 0}%`} label="Precisión" /><DataBox value={ultimo?.respondidas ?? 0} label="Respondidas" /></div><div className="grid lg:grid-cols-2 gap-4 text-left"><InfoBox title="Diagnóstico automático" icon={<ClipboardList className="text-green-600" />}><p><b>Fortaleza:</b> {diag.fortaleza}</p><p><b>Dificultad:</b> {diag.dificultad}</p><p><b>Recomendación:</b> {diag.recomendacion}</p></InfoBox><InfoBox title="Logros obtenidos" icon={<Award className="text-yellow-600" />}>{insignias.length === 0 ? <p className="text-slate-700">Aún no obtuvo insignias.</p> : insignias.map((l) => { const Icon = l.icono; return <div key={l.nombre} className="flex gap-3 bg-yellow-50 rounded-xl p-3 border border-yellow-300/40"><Icon className="text-yellow-600" /><div><b>{l.nombre}</b><div className="text-sm text-slate-600">{l.texto}</div></div></div>; })}</InfoBox></div><button onClick={reiniciar} className="inline-flex items-center rounded-xl bg-[#c62828] hover:bg-[#e53935] text-white px-4 py-2"><Play className="mr-2" size={18} /> Nuevo intento</button></div></PanelCard>;
}
function ClassroomMode({ form, cambiar, secciones, topAula }: any) {
  return <PanelCard><div className="text-center space-y-6"><div className="inline-flex items-center gap-2 bg-white text-slate-900 border border-yellow-300/50 rounded-full px-4 py-2 shadow-sm"><Tv size={20} /> Pantalla para proyector o TV</div><h2 className="text-4xl md:text-6xl font-bold text-slate-900">Reto semanal de cálculo</h2><div className="grid md:grid-cols-2 gap-3 max-w-xl mx-auto text-left"><SelectField label="Grado" value={form.grado} options={GRADOS} onChange={(v) => cambiar("grado", v)} /><SelectField label="Sección" value={form.seccion} options={secciones} onChange={(v) => cambiar("seccion", v)} /></div><p className="text-xl text-slate-700">Aula seleccionada: {form.grado} {form.seccion}</p><div className="grid md:grid-cols-5 gap-4">{topAula.length === 0 ? <div className="md:col-span-5 bg-yellow-50 rounded-2xl p-8 text-slate-700 border border-yellow-300/40">Aún no hay estudiantes en esta aula.</div> : topAula.map((r, i) => <div key={r.id} className="bg-white rounded-2xl p-5 border border-yellow-300/40 shadow-sm"><div className="text-4xl font-bold text-[#c62828]">#{i + 1}</div><div className="font-bold mt-2 text-slate-900">{r.estudiante}</div><div className="text-slate-600 text-sm">{r.puntaje} pts</div></div>)}</div><p className="text-2xl font-semibold text-[#c62828]">¡10 minutos para mejorar, competir y aprender!</p></div></PanelCard>;
}
function ConfigPanel({ config, setConfig }: any) {
  const campos = [["duracionReto", "Duración del reto en segundos"], ["puntosCorrecta", "Puntos por respuesta correcta"], ["bonoPrecision", "Bono por precisión"], ["umbralPrecision", "Umbral de precisión (%)"], ["bonoVelocidad", "Bono por velocidad"], ["umbralVelocidad", "Mínimo de respuestas para bono"]];
  return <PanelCard><SectionTitle icon={<Settings className="text-[#c62828]" />} title="Panel de configuración" /><div className="grid md:grid-cols-3 gap-4">{campos.map(([campo, label]) => <NumberField key={campo} label={label} value={config[campo]} onChange={(v) => setConfig((p) => ({ ...p, [campo]: Number(v) }))} />)}</div><button className="rounded-xl bg-green-600 hover:bg-green-700 text-white mt-5 px-4 py-2" onClick={() => storage.guardarConfig(config)}>Guardar configuración</button></PanelCard>;
}
function ManagementPanel({ est, busqueda, setBusqueda, filtroGrado, setFiltroGrado, filtroSeccion, setFiltroSeccion, filtroDocente, setFiltroDocente, rankingFiltrado, semanal, porAula, porMejora, aulaCampeona, topGrado, resumenAuto, mejorMejora }: any) {
  return <div className="space-y-6"><div className="grid md:grid-cols-4 gap-4"><DataBox value={est.participaciones} label="Participaciones" /><DataBox value={est.promedio} label="Promedio" /><DataBox value={`${est.precision}%`} label="Precisión" /><DataBox value={est.puntajeTotal} label="Puntaje total" /></div><ExecutivePanel resumenAuto={resumenAuto} aulaCampeona={aulaCampeona} topGrado={topGrado} rankingFiltrado={rankingFiltrado} mejorMejora={mejorMejora} /><PanelCard><h2 className="text-2xl font-bold mb-4 text-slate-900">Filtros de análisis</h2><div className="grid md:grid-cols-5 gap-3"><div className="relative md:col-span-2"><Search size={18} className="absolute left-3 top-3.5 text-slate-500" /><input className={`${estilos.input} pl-10`} placeholder="Buscar estudiante, docente o juego" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div><SelectField value={filtroGrado} options={["Todos", ...GRADOS]} onChange={setFiltroGrado} /><SelectField value={filtroSeccion} options={["Todas", ...TODAS_SECCIONES]} onChange={setFiltroSeccion} /><SelectField value={filtroDocente} options={["Todos", ...DOCENTES]} onChange={setFiltroDocente} /></div></PanelCard><ChartsPanel rankingFiltrado={rankingFiltrado} /><div className="grid lg:grid-cols-3 gap-6"><SummaryBox title="Promedio por docente" data={promedioPor(rankingFiltrado, "docente")} /><SummaryBox title="Promedio por grado" data={promedioPor(rankingFiltrado, "grado")} /><SummaryBox title="Promedio por sección" data={promedioPor(rankingFiltrado, "seccion")} /></div><div className="grid lg:grid-cols-3 gap-6"><MiniRank title="Ranking semanal" data={semanal} type="estudiante" /><MiniRank title="Ranking por aula" data={porAula} type="aula" /><MiniRank title="Ranking por mejora" data={porMejora} type="mejora" /></div></div>;
}
function ExecutivePanel({ resumenAuto, aulaCampeona, topGrado, rankingFiltrado, mejorMejora }: any) { return <PanelCard><div className="flex flex-col md:flex-row md:items-start justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-900 mb-2">Panel ejecutivo para Dirección</h2><p className="text-slate-700 leading-relaxed">{resumenAuto}</p></div><button className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 shrink-0 flex items-center" onClick={() => exportarReporteTexto({ resumen: resumenAuto, aulaCampeona, topGrado })}><Download size={18} className="mr-2" /> Descargar reporte</button></div><div className="grid md:grid-cols-3 gap-4 mt-5"><DataBox value={aulaCampeona?.aula || "-"} label="Sección campeona" /><DataBox value={mejorMejora ? `+${mejorMejora.mejora}` : "-"} label="Mayor mejora" /><DataBox value={rankingFiltrado.length} label="Registros analizados" /></div><div className="mt-5"><h3 className="font-bold text-slate-900 mb-3">Top 3 por grado</h3><div className="grid md:grid-cols-5 gap-3">{topGrado.map((grupo) => <div key={grupo.grado} className="bg-yellow-50 border border-yellow-300/40 rounded-xl p-3"><div className="font-bold text-[#c62828] mb-2">{grupo.grado}</div>{grupo.estudiantes.length === 0 ? <div className="text-sm text-slate-600">Sin registros</div> : grupo.estudiantes.map((e, i) => <div key={`${grupo.grado}-${e.id}`} className="text-sm text-slate-700"><b>{i + 1}.</b> {e.estudiante} - {e.puntaje}</div>)}</div>)}</div></div></PanelCard>; }
function ChartsPanel({ rankingFiltrado }: any) { const grados = promedioPor(rankingFiltrado, "grado").map((x) => ({ name: x.clave, value: x.promedio })); const docentes = promedioPor(rankingFiltrado, "docente").map((x) => ({ name: x.clave, value: x.cantidad })); return <div className="grid lg:grid-cols-2 gap-6"><PanelCard><h3 className="font-bold text-xl mb-4 text-slate-900">Promedio por grado</h3><SimpleBarChart data={grados} suffix=" pts" color="bg-[#c62828]" /></PanelCard><PanelCard><h3 className="font-bold text-xl mb-4 text-slate-900">Participación por docente</h3><SimpleBarChart data={docentes} suffix="" color="bg-[#0b2c6b]" /></PanelCard></div>; }
function SimpleBarChart({ data, suffix, color }: any) { if (!data || data.length === 0) return <p className="text-slate-700">Sin datos todavía.</p>; const maximo = Math.max(...data.map((d) => Number(d.value || 0)), 1); return <div className="space-y-3">{data.map((item) => { const valor = Number(item.value || 0); const ancho = Math.max(6, Math.round((valor / maximo) * 100)); return <div key={item.name} className="space-y-1"><div className="flex justify-between text-sm text-slate-700"><span className="font-medium">{item.name}</span><span>{valor}{suffix}</span></div><div className="h-4 bg-yellow-50 border border-yellow-300/40 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{ width: `${ancho}%` }} /></div></div>; })}</div>; }
function SummaryBox({ title, data }: any) { return <PanelCard><h3 className="font-bold text-xl mb-4 text-slate-900">{title}</h3>{data.length === 0 ? <p className="text-slate-700 text-sm">Sin datos todavía.</p> : <div className="space-y-3">{data.slice(0, 6).map((x) => <div key={x.clave} className="bg-yellow-50 rounded-xl p-3 border border-yellow-300/40"><div className="flex justify-between text-sm mb-1"><span>{x.clave}</span><b className="text-[#c62828]">{x.promedio} pts</b></div><div className="text-xs text-slate-600">{x.cantidad} participación(es)</div></div>)}</div>}</PanelCard>; }
function MiniRank({ title, data, type }: any) { return <PanelCard><h3 className="font-bold text-xl mb-4 text-slate-900">{title}</h3>{data.length === 0 ? <p className="text-slate-700 text-sm">Aún no hay datos suficientes.</p> : <div className="space-y-3">{data.slice(0, 8).map((x, i) => <div key={`${title}-${i}`} className="bg-yellow-50 rounded-xl p-3 flex justify-between gap-3 border border-yellow-300/40"><div><div className="font-bold">#{i + 1} {type === "aula" ? x.aula : x.estudiante}</div><div className="text-xs text-slate-600">{type === "aula" ? `${x.cantidad} participación(es)` : type === "mejora" ? `${x.grado} ${x.seccion} · ${x.intentos} intentos` : `${x.grado} ${x.seccion} · ${x.docente}`}</div></div><div className="text-right font-bold text-[#c62828]">{type === "aula" ? `${x.promedio} pts` : type === "mejora" ? `+${x.mejora}` : `${x.puntaje} pts`}</div></div>)}</div>}</PanelCard>; }
function RankingTable({ data, rankingFiltrado, resumenAuto, aulaCampeona, topGrado, puedeLimpiar, limpiar }: any) { return <PanelCard><div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4"><div className="flex items-center gap-3"><BarChart3 className="text-[#c62828]" /><h2 className="text-2xl font-bold text-slate-900">Ranking institucional</h2></div><div className="flex flex-wrap gap-2"><button onClick={() => exportarCSV(rankingFiltrado)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 flex items-center"><Download size={18} className="mr-2" /> CSV</button><button onClick={() => exportarExcel(rankingFiltrado)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 flex items-center"><Download size={18} className="mr-2" /> Excel</button><button onClick={() => exportarReporteTexto({ resumen: resumenAuto, aulaCampeona, topGrado })} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 flex items-center"><Download size={18} className="mr-2" /> Reporte</button>{puedeLimpiar && <button onClick={limpiar} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 flex items-center"><RotateCcw size={18} className="mr-2" /> Limpiar ranking</button>}</div></div>{data.length === 0 ? <div className="text-slate-700 bg-yellow-50 rounded-2xl p-6 text-center border border-yellow-300/40">Aún no hay puntajes guardados.</div> : <DataTable data={data} />}</PanelCard>; }
function DataTable({ data }: any) { return <div className="overflow-x-auto bg-white rounded-2xl border border-yellow-300/40"><table className="w-full text-sm text-slate-900"><thead><tr className="text-left bg-yellow-50 border-b border-yellow-300/40"><th className="py-3 px-2">Puesto</th><th className="px-2">Estudiante</th><th className="px-2">Grado</th><th className="px-2">Docente</th><th className="px-2">Juego</th><th className="px-2">Nivel</th><th className="px-2">Puntaje</th><th className="px-2">Correctas</th><th className="px-2">Fecha</th></tr></thead><tbody>{data.map((r, i) => <tr key={r.id} className="border-b border-yellow-300/20 hover:bg-yellow-50"><td className="py-3 px-2 font-bold">#{i + 1}</td><td className="px-2">{r.estudiante}</td><td className="px-2">{r.grado} {r.seccion}</td><td className="px-2">{r.docente}</td><td className="px-2">{r.juego}</td><td className="px-2">{r.nivelNombre || "Nivel 1"}</td><td className="px-2 font-bold text-[#c62828]">{r.puntaje}</td><td className="px-2">{r.correctas} / {r.respondidas || (r.correctas + r.incorrectas)}</td><td className="px-2 text-slate-600">{r.fecha}</td></tr>)}</tbody></table></div>; }
