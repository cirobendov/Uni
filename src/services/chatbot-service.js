import LLMService from "./llm-service.js";

// Chatbot vocacional básico (sin dependencias externas)
// Objetivo: orientar sobre carreras, categorías y universidades usando la BD existente
export default class ChatbotService {
  constructor() {
    this.llm = new LLMService();
  }

  // Punto de entrada
  async handleMessage(message) {
    const text = (message || "").trim();
    if (!text) return this.reply("Necesito un mensaje para ayudarte. Contame qué estás buscando.");

    const systemHint = [
      "Sos un orientador vocacional.",
      "Respondé de forma clara, breve y natural (español de Argentina).",
      "Evitá inventar datos específicos de universidades o planes locales.",
      "Si el usuario pide definiciones/explicaciones de carreras, brindá un panorama general, habilidades típicas y salidas laborales.",
      "Si el usuario pide listados o datos específicos de instituciones, aclarar que podés orientar de forma general (sin datos locales)."
    ].join(" ");

    const userPrompt = `Usuario: ${text}\n\nObjetivo: orientar vocacionalmente con explicación general y ejemplos típicos. No incluyas universidades concretas.`;

    try {
      const answer = await this.llm.generateOpenAnswer(userPrompt, { systemHint });
      return this.reply(answer);
    } catch (e) {
      return this.reply("Por ahora no puedo responder con el asistente. Probá de nuevo en unos segundos.");
    }
  }

  // Extrae posible entidad de carrera/categoría: toma todo después de palabras de pregunta comunes
  extractEntity(original) {
    const cleaned = original
      .replace(/\?|\.|\!/g, " ")
      .replace(/\b(que es|qué es|informacion|información|info|sobre|acerca de|definicion|definición|explicame|explícame|carreras de|categoria|categoría|me gustan|interesado en|área|area|rama|campo|sector|universidad|universidades|en que universidad|en qué universidad|donde estudiar|dónde estudiar|donde puedo estudiar|dónde puedo estudiar|ofrece|ofrecen|lista|listar|todas las carreras|de la|de el|del|de)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Heurística: si quedó muy corto, probablemente no haya entidad
    if (!cleaned || cleaned.length < 2) return null;
    return cleaned;
  }

  // 1) Información de una carrera por nombre
  async intentCareerInfoByName(nombreCarrera) {
    const carrera = await this.findCareerByName(nombreCarrera);
    if (!carrera) {
      // Si no está en BD, generamos una explicación natural con LLM
      try {
        const overview = await this.llm.generateCareerOverview(nombreCarrera);
        return this.reply(overview);
      } catch (e) {
        return this.reply(`No encontré la carrera "${nombreCarrera}" en la base y no pude generar una explicación en este momento.`);
      }
    }

    // Buscar categoría asociada, si existe
    let categoria = null;
    if (carrera.id_categoria) {
      const cats = await this.commonRepo.getByField("categorias", "id", carrera.id_categoria);
      categoria = cats?.[0] || null;
    }

    // Universidades que ofrecen esta carrera (usando getAllExpanded para evitar nuevo SQL)
    const universidades = await this.universityRepo.getAllExpanded();
    const universidadesQueLaOfrecen = universidades
      .filter(u => Array.isArray(u.carreras))
      .filter(u => u.carreras.some(item => item?.carrera?.id === carrera.id))
      .map(u => u.nombre);

    const partes = [];
    partes.push(`Carrera: ${carrera.nombre}`);
    if (carrera.descripcion) partes.push(`Descripción: ${carrera.descripcion}`);
    if (categoria?.nombre) partes.push(`Categoría: ${categoria.nombre}`);
    if (universidadesQueLaOfrecen.length)
      partes.push(`Universidades que la dictan: ${universidadesQueLaOfrecen.join(", ")}`);

    // Intentar agregar explicación "humana" del LLM
    try {
      const overview = await this.llm.generateCareerOverview(carrera.nombre);
      if (overview) {
        partes.push("\nResumen orientativo:");
        partes.push(overview);
      }
    } catch (_) {
      // si falla el LLM, seguimos con lo disponible
    }

    return this.reply(partes.join("\n"), { carreraId: carrera.id });
  }

  // 2) Carreras por nombre de categoría (usa CategoryRepository SQL existente)
  async intentCareersByCategoryName(nombreCategoria) {
    // Buscar categoría por nombre (case-insensitive)
    const categorias = await this.commonRepo.getByField("categorias", "nombre", nombreCategoria);
    let categoria = categorias?.[0];
    if (!categoria) {
      // Intento flexible: traer todas y buscar por includes
      const todas = await this.commonRepo.getAll("categorias");
      categoria = (todas || []).find(c => c.nombre?.toLowerCase().includes(nombreCategoria.toLowerCase()));
    }

    if (!categoria) {
      return this.reply(`No encontré la categoría "${nombreCategoria}". Probá con otra o pedime todas las carreras.`);
    }

    const carreras = await this.careerRepo.getCarrerasByCategoria(categoria.id);
    if (!carreras?.length) {
      return this.reply(`No encontré carreras en la categoría "${categoria.nombre}".`);
    }

    const lista = carreras.map(c => `- ${c.nombre}`).join("\n");
    return this.reply(`Carreras en "${categoria.nombre}":\n${lista}`, { categoriaId: categoria.id });
  }

  // 3) Universidades que dictan una carrera por nombre (sin nuevo SQL)
  async intentUniversitiesByCareerName(nombreCarrera) {
    const carrera = await this.findCareerByName(nombreCarrera);
    if (!carrera) {
      return this.reply(`No encontré la carrera "${nombreCarrera}". ¿Querés que te liste carreras?`);
    }

    const universidades = await this.universityRepo.getAllExpanded();
    const matches = universidades
      .filter(u => Array.isArray(u.carreras))
      .filter(u => u.carreras.some(item => item?.carrera?.id === carrera.id));

    if (!matches.length) return this.reply("No encontré universidades que ofrezcan esa carrera en la base actual.");

    const lista = matches.map(u => `- ${u.nombre}`).join("\n");
    return this.reply(`Universidades que dictan ${carrera.nombre}:\n${lista}`, { carreraId: carrera.id });
  }

  // 4) Listar todas las carreras
  async intentListAllCareers() {
    const carreras = await this.commonRepo.getAll("carreras");
    if (!carreras?.length) return this.reply("La base no tiene carreras cargadas.");
    const lista = carreras.map(c => `- ${c.nombre}`).join("\n");
    return this.reply(`Listado de carreras:\n${lista}`);
  }

  // Utilidades
  normalize(str) {
    return (str || "")
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}+/gu, '');
  }

  async findCareerByName(nombre) {
    // Intento exacto primero
    let c = await this.commonRepo.getOneByField("carreras", "nombre", nombre);
    if (c) return c;
    // Búsqueda flexible
    const todas = await this.commonRepo.getAll("carreras");
    const queryNorm = this.normalize(nombre);
    return (todas || []).find(item => this.normalize(item.nombre).includes(queryNorm)) || null;
  }

  reply(text, meta = {}) {
    return { reply: text, meta };
  }
}
