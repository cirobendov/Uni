// Simple LLM wrapper for Ollama local HTTP API
// Requires Ollama running locally and a model pulled (e.g., `ollama run qwen2.5:3b` once)

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const LLM_MODEL = process.env.LLM_MODEL || "qwen2.5:3b";

export default class LLMService {
  constructor({ baseUrl = OLLAMA_URL, model = LLM_MODEL } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  async generate({ system = "", prompt = "" }) {
    const body = {
      model: this.model,
      prompt: this.composePrompt(system, prompt),
      stream: false,
      options: {
        temperature: 0.6,
        top_p: 0.9
      }
    };

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama error ${res.status}: ${text}`);
    }

    const data = await res.json();
    // Ollama returns { response: string, ... }
    return data.response?.trim() || "";
  }

  composePrompt(system, user) {
    const sys = (system || "").trim();
    const usr = (user || "").trim();
    if (!sys) return usr;
    return `System:\n${sys}\n\nUser:\n${usr}`;
  }

  async generateCareerOverview(name) {
    const system = `Sos un orientador vocacional. Explicás carreras de forma breve, clara y neutral, en español de Argentina. Evitá listas muy largas. No inventes universidades ni datos locales. Si hay ambigüedad, aclaralo en una línea.`;

    const user = `Explicá brevemente la carrera: ${name}.
Incluí:
- Qué abarca en términos generales (2-3 líneas)
- Habilidades o perfil típicos (1 línea)
- Salidas laborales comunes (1 línea)
- Aclaración: la duración y el plan pueden variar según institución y país.`;

    return await this.generate({ system, prompt: user });
  }

  async generateOpenAnswer(userPrompt, { systemHint = "Sos un orientador vocacional. Respondé claro, breve y en español de Argentina." } = {}) {
    return await this.generate({ system: systemHint, prompt: userPrompt });
  }
}
