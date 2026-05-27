export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar OPENAI_API_KEY en el servidor." });
  }

  const { grado, juego, nivel } = req.body || {};
  const nombreJuego = juego?.nombre || juego?.id || "calculo mental";
  const descripcionJuego = juego?.descripcion || "ejercicios de calculo";

  const prompt = `Genera UN ejercicio de calculo mental para secundaria en Peru.
Grado: ${grado}
Juego: ${nombreJuego}
Descripcion del juego: ${descripcionJuego}
Nivel de dificultad: ${nivel}

Reglas:
- Debe ser apropiado para el grado indicado.
- Debe tener una unica respuesta correcta.
- Debe tener 4 alternativas.
- No uses explicacion larga.
- La respuesta debe coincidir exactamente con una de las alternativas.
- Devuelve SOLO JSON valido, sin markdown, con esta forma:
{"pregunta":"...","respuesta":"...","opciones":["...","...","...","..."]}`;

  try {
    const respuestaOpenAI = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 350,
      }),
    });

    if (!respuestaOpenAI.ok) {
      const detalle = await respuestaOpenAI.text();
      return res.status(500).json({ error: "OpenAI no respondio correctamente", detalle });
    }

    const data = await respuestaOpenAI.json();
    const texto =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      data.output?.[0]?.content?.[0]?.content ||
      "";

    let ejercicio;
    try {
      ejercicio = JSON.parse(String(texto).trim());
    } catch {
      return res.status(500).json({ error: "La IA no devolvio JSON valido", texto });
    }

    if (!ejercicio.pregunta || !ejercicio.respuesta || !Array.isArray(ejercicio.opciones)) {
      return res.status(500).json({ error: "Formato incompleto devuelto por la IA", ejercicio });
    }

    if (!ejercicio.opciones.map(String).includes(String(ejercicio.respuesta))) {
      ejercicio.opciones[0] = String(ejercicio.respuesta);
    }

    return res.status(200).json({
      pregunta: String(ejercicio.pregunta),
      respuesta: String(ejercicio.respuesta),
      opciones: ejercicio.opciones.slice(0, 4).map(String),
    });
  } catch (error: any) {
    return res.status(500).json({ error: "Error interno generando ejercicio", detalle: error?.message || String(error) });
  }
}
