#!/usr/bin/env python3
"""
Python script for educational brute-force password simulation.

This script provides a simple interface for the React frontend to call
for password simulation results. It can be run as a standalone script
or imported as a module.

Usage:
    python password_simulator.py --password "abc123" --mode normal
    python password_simulator.py --password "abc123" --mode step --output results.json
"""

import sys
import json
import argparse
from typing import Dict, Any
from brute_force_simulator import PasswordSimulator, SimulationMode

def run_simulation(password: str, mode: str = "normal", max_attempts: int = 1000) -> Dict[str, Any]:
    """Run a password simulation and return results as a dictionary.
    
    Args:
        password: The password to simulate attacking
        mode: Simulation mode ("step", "normal", "fast")
        max_attempts: Maximum number of attempts
        
    Returns:
        Dictionary with simulation results
    """
    try:
        # Convert string mode to enum
        simulation_mode = SimulationMode(mode)
        
        # Create simulator
        simulator = PasswordSimulator(simulation_mode)
        
        # Run simulation
        result = simulator.simulate_attack(password, max_attempts)
        
        # Convert to dictionary
        return result.to_dict()
        
    except Exception as e:
        return {
            "error": str(e),
            "success": False,
            "password": password,
            "mode": mode
        }

def main():
    """Main function for command-line execution."""
    parser = argparse.ArgumentParser(description="Educational Password Brute-Force Simulator")
    parser.add_argument("--password", required=True, help="Target password to simulate attacking")
    parser.add_argument("--mode", choices=["step", "normal", "fast"], 
                       default="normal", help="Simulation mode")
    parser.add_argument("--max-attempts", type=int, default=1000, 
                       help="Maximum number of attempts")
    parser.add_argument("--output", help="Output JSON file for results")
    
    args = parser.parse_args()
    
    # Run simulation
    result = run_simulation(args.password, args.mode, args.max_attempts)
    
    # Print results
    if "error" in result:
        print(f"Error: {result['error']}", file=sys.stderr)
        sys.exit(1)
    
    print(json.dumps(result, indent=2))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"\nResults saved to: {args.output}")

if __name__ == "__main__":
    main()
