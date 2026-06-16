export interface PythonSimulationResult {
  password: string;
  strength: "weak" | "medium" | "strong";
  attempts: number;
  elapsed_time: number;
  found_at_attempt: number | null;
  charset_size: number;
  entropy: number;
  mode: string;
  log_entries: Array<Record<string, any>>;
  timestamp: string;
}

const API_BASE = "/api";

async function callApi(endpoint: string, body: Record<string, any>): Promise<any> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error("Network error: " + (e instanceof Error ? e.message : String(e)));
  }
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    throw new Error("Invalid JSON response from server");
  }
  if (!data.success) {
    throw new Error(data.error || "Unknown API error");
  }
  return data;
}

export class PasswordSimulationService {
  async runSimulation(
    password: string,
    mode: string = "normal",
    maxAttempts: number = 1000
  ): Promise<PythonSimulationResult> {
    const data = await callApi("/simulate", {
      password,
      mode,
      max_attempts: maxAttempts,
    });
    return data.result as PythonSimulationResult;
  }

  async runStepByStepSimulation(
    password: string,
    maxAttempts: number = 100
  ): Promise<PythonSimulationResult> {
    return this.runSimulation(password, "step", maxAttempts);
  }

  async runNormalSimulation(
    password: string,
    maxAttempts: number = 1000
  ): Promise<PythonSimulationResult> {
    return this.runSimulation(password, "normal", maxAttempts);
  }

  async runFastSimulation(
    password: string,
    maxAttempts: number = 500
  ): Promise<PythonSimulationResult> {
    return this.runSimulation(password, "fast", maxAttempts);
  }
}

export default new PasswordSimulationService();
