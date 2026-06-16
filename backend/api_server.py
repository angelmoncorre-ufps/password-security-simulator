#!/usr/bin/env python3
"""
Simple Flask HTTP API server for the brute-force simulator.
Allows the React frontend to call the Python simulation via HTTP.
"""

import sys
import json
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from brute_force_simulator import PasswordSimulator, SimulationMode, SimulationResult

app = Flask(__name__, static_folder=None)
CORS(app)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    file_path = FRONTEND_DIR / path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(str(FRONTEND_DIR), path)
    index = FRONTEND_DIR / "index.html"
    if index.exists():
        return send_from_directory(str(FRONTEND_DIR), "index.html")
    return jsonify({"error": "Frontend not built. Run 'cd frontend && npx vite build' first."}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "brute-force-simulator"})


@app.route("/api/simulate", methods=["POST"])
def simulate():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        password = data.get("password", "")
        mode_str = data.get("mode", "normal")
        max_attempts = data.get("max_attempts", 1000)

        if not password:
            return jsonify({"error": "Password is required"}), 400

        if mode_str not in ("step", "normal", "fast"):
            return jsonify({"error": "Invalid mode"}), 400

        mode = SimulationMode(mode_str)
        simulator = PasswordSimulator(mode)
        result = simulator.simulate_attack(password, max_attempts)

        return jsonify({"success": True, "result": result.to_dict()})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        password = data.get("password", "")
        if not password:
            return jsonify({"error": "Password is required"}), 400

        simulator = PasswordSimulator(SimulationMode.NORMAL)
        charset_size = simulator._get_charset_size(password)
        entropy = simulator.calculate_entropy(password)
        strength = simulator.determine_strength(password)

        return jsonify({
            "success": True,
            "analysis": {
                "password": password,
                "length": len(password),
                "charset_size": charset_size,
                "entropy_bits": round(entropy, 2),
                "strength": strength,
            },
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    print(f"Starting server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
