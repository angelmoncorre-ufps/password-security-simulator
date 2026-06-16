#!/usr/bin/env python3
"""
Educational Brute-Force Password Simulation

This script simulates the brute-force attack process for educational purposes.
It demonstrates how password strength affects the time required to crack passwords
through systematic guessing.

WARNING: This is for educational use only. No real attacks are performed.
All passwords are fictional and used for demonstration purposes only.
"""

import time
import random
import string
import math
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime

class SimulationMode(Enum):
    STEP_BY_STEP = "step"
    NORMAL = "normal"
    FAST = "fast"

@dataclass
class SimulationResult:
    """Results of a brute-force simulation."""
    password: str
    strength: str
    attempts: int
    elapsed_time: float
    found_at_attempt: Optional[int] = None
    charset_size: int = 0
    entropy: float = 0.0
    mode: str = "normal"
    log_entries: List[Dict] = None
    
    def __post_init__(self):
        if self.log_entries is None:
            self.log_entries = []
    
    def to_dict(self) -> Dict:
        """Convert result to dictionary for JSON serialization."""
        return {
            "password": self.password,
            "strength": self.strength,
            "attempts": self.attempts,
            "elapsed_time": self.elapsed_time,
            "found_at_attempt": self.found_at_attempt,
            "charset_size": self.charset_size,
            "entropy": self.entropy,
            "mode": self.mode,
            "log_entries": self.log_entries,
            "timestamp": datetime.now().isoformat()
        }

class PasswordSimulator:
    """Educational password brute-force simulator."""
    
    # Common weak passwords used in educational examples
    COMMON_WEAK_PASSWORDS = [
        "123456", "password", "abc123", "qwerty", "admin", 
        "letmein", "monkey", "1234567890", "pass", "123",
        "12345678", "12345", "1234", "111111", "sunshine",
        "iloveyou", "welcome", "admin123", "password123"
    ]
    
    # Character sets for password generation
    # Must match frontend charset detection (26+26+10+33=95)
    CHARSETS = {
        "lowercase": string.ascii_lowercase,
        "uppercase": string.ascii_uppercase,
        "digits": string.digits,
        "special": string.punctuation + " ",
    }
    
    def __init__(self, mode: SimulationMode = SimulationMode.NORMAL):
        self.mode = mode
        self.attempts_per_second = {
            SimulationMode.STEP_BY_STEP: 0,  # Manual step
            SimulationMode.NORMAL: 1e10,     # 10 billion attempts/sec
            SimulationMode.FAST: 5e10        # 50 billion attempts/sec
        }[mode]
    
    def calculate_entropy(self, password: str) -> float:
        """Calculate password entropy in bits using Shannon entropy."""
        charset_size = self._get_charset_size(password)
        if charset_size == 0:
            return 0.0
        return len(password) * math.log2(charset_size)
    
    def _get_charset_size(self, password: str) -> int:
        """Get the size of the character set used in the password."""
        charset_size = 0
        if any(c in self.CHARSETS["lowercase"] for c in password):
            charset_size += len(self.CHARSETS["lowercase"])
        if any(c in self.CHARSETS["uppercase"] for c in password):
            charset_size += len(self.CHARSETS["uppercase"])
        if any(c in self.CHARSETS["digits"] for c in password):
            charset_size += len(self.CHARSETS["digits"])
        if any(c in self.CHARSETS["special"] for c in password):
            charset_size += len(self.CHARSETS["special"])
        return charset_size if charset_size > 0 else len(self.CHARSETS["lowercase"])
    
    def determine_strength(self, password: str) -> str:
        """Determine password strength based on entropy."""
        entropy = self.calculate_entropy(password)
        if entropy >= 60:
            return "strong"
        elif entropy >= 36:
            return "medium"
        else:
            return "weak"
    
    def generate_candidate(self, charset: str, length: int) -> str:
        """Generate a random password candidate."""
        return ''.join(random.choice(charset) for _ in range(length))
    
    def generate_candidate_batch(self, target_password: str, batch_size: int, 
                                batch_index: int, max_attempts: int) -> Tuple[List[str], bool]:
        """Generate a batch of password candidates.
        
        Returns:
            Tuple of (candidates, found) where found indicates if the target password was found.
        """
        charset = self._get_charset_for_password(target_password)
        length = len(target_password)
        candidates = []
        found = False
        
        for i in range(batch_size):
            abs_index = batch_index * batch_size + i
            
            # Check if this is the target password
            if abs_index < max_attempts:
                # Use common weak passwords for early indices
                if abs_index < len(self.COMMON_WEAK_PASSWORDS):
                    candidate = self.COMMON_WEAK_PASSWORDS[abs_index]
                    # Adjust length to match target if needed
                    if len(candidate) != length:
                        candidate = candidate[:length] if len(candidate) > length else candidate + \
                                   self.generate_candidate(charset, length - len(candidate))
                else:
                    candidate = self.generate_candidate(charset, length)
                
                candidates.append(candidate)
                
                # Check if this is the target password
                if candidate == target_password:
                    found = True
            else:
                # Generate random candidate for indices beyond max_attempts
                candidates.append(self.generate_candidate(charset, length))
        
        return candidates, found
    
    def _get_charset_for_password(self, password: str) -> str:
        """Get the appropriate charset for a password."""
        charset = ""
        if any(c in self.CHARSETS["lowercase"] for c in password):
            charset += self.CHARSETS["lowercase"]
        if any(c in self.CHARSETS["uppercase"] for c in password):
            charset += self.CHARSETS["uppercase"]
        if any(c in self.CHARSETS["digits"] for c in password):
            charset += self.CHARSETS["digits"]
        if any(c in self.CHARSETS["special"] for c in password):
            charset += self.CHARSETS["special"]
        return charset if charset else self.CHARSETS["lowercase"]
    
    def simulate_attack(self, target_password: str, max_attempts: int = 1000) -> SimulationResult:
        """Simulate a brute-force attack on a target password.
        
        Args:
            target_password: The password to attempt to crack
            max_attempts: Maximum number of attempts to make
            
        Returns:
            SimulationResult with attack details
        """
        # Determine strength and calculate theoretical values
        strength = self.determine_strength(target_password)
        charset_size = self._get_charset_size(target_password)
        entropy = self.calculate_entropy(target_password)
        
        # Set max attempts based on strength
        strength_limits = {
            "weak": 100,
            "medium": 500,
            "strong": 300,
            "very-strong": 200
        }
        max_attempts = strength_limits.get(strength, max_attempts)
        
        # Determine when password is likely to be found
        find_at_fractions = {
            "weak": 0.3,
            "medium": 0.75,
            "strong": 2.0,
            "very-strong": 3.0
        }
        
        find_at = int(max_attempts * find_at_fractions.get(strength, 0.5))
        if find_at <= 1:
            find_at = 1
        
        log_entries = []
        attempts = 0
        found_at_attempt = None
        start_time = time.time()
        
        # Simulation loop
        for batch_idx in range(0, max_attempts, self._get_batch_size()):
            batch_size = min(self._get_batch_size(), max_attempts - batch_idx)
            candidates, found = self.generate_candidate_batch(
                target_password, batch_size, batch_idx // self._get_batch_size(), 
                max_attempts
            )
            
            # Add to log
            for i, candidate in enumerate(candidates):
                abs_attempt = batch_idx + i + 1
                attempts = abs_attempt
                is_match = candidate == target_password
                
                log_entry = {
                    "attempt": abs_attempt,
                    "candidate": candidate,
                    "is_match": is_match,
                    "elapsed_time": time.time() - start_time
                }
                log_entries.append(log_entry)
                
                if is_match:
                    found_at_attempt = abs_attempt
                    break
            
            if found:
                break
            
            # Simulate time passing
            time.sleep(0.01)  # Small delay for realistic timing
        
        elapsed_time = time.time() - start_time
        
        return SimulationResult(
            password=target_password,
            strength=strength,
            attempts=attempts,
            elapsed_time=elapsed_time,
            found_at_attempt=found_at_attempt,
            charset_size=charset_size,
            entropy=entropy,
            mode=self.mode.value,
            log_entries=log_entries
        )
    
    def _get_batch_size(self) -> int:
        """Get batch size based on simulation mode."""
        if self.mode == SimulationMode.STEP_BY_STEP:
            return 1
        elif self.mode == SimulationMode.FAST:
            return 15
        else:  # NORMAL
            return 3

def main():
    """Example usage of the PasswordSimulator."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Educational Password Brute-Force Simulator")
    parser.add_argument("--password", help="Target password to simulate attacking")
    parser.add_argument("--mode", choices=["step", "normal", "fast"], 
                       default="normal", help="Simulation mode")
    parser.add_argument("--max-attempts", type=int, default=1000, 
                       help="Maximum number of attempts")
    parser.add_argument("--output", help="Output JSON file for results")
    
    args = parser.parse_args()
    
    # Set random seed for reproducible results
    random.seed(42)
    
    # Create simulator
    mode = SimulationMode(args.mode)
    simulator = PasswordSimulator(mode)
    
    # Use default test password if none provided
    if not args.password:
        test_passwords = ["abc123", "Tr0ub4dor&3!xY#9", "password", "P@ssw0rd!"]
        target_password = random.choice(test_passwords)
        print(f"Using test password: {target_password}")
    else:
        target_password = args.password
    
    print(f"Starting simulation (Mode: {mode.value})")
    print(f"Target password: {target_password}")
    print(f"Max attempts: {args.max_attempts}")
    
    # Run simulation
    result = simulator.simulate_attack(target_password, args.max_attempts)
    
    print("\n" + "="*60)
    print("SIMULATION RESULTS")
    print("="*60)
    print(f"Password: {result.password}")
    print(f"Strength: {result.strength}")
    print(f"Attempts: {result.attempts:,}")
    print(f"Time elapsed: {result.elapsed_time:.2f} seconds")
    print(f"Found at attempt: {result.found_at_attempt or 'Not found'}")
    print(f"Charset size: {result.charset_size}")
    print(f"Entropy: {result.entropy:.1f} bits")
    print("="*60)
    
    # Save results if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result.to_dict(), f, indent=2)
        print(f"\nResults saved to: {args.output}")
    
    # Print educational insights
    print("\nEDUCATIONAL INSIGHTS:")
    print("-" * 60)
    if result.strength == "weak":
        print("This weak password was cracked quickly, demonstrating why simple passwords")
        print("are vulnerable to automated attacks.")
    elif result.strength == "medium":
        print("This medium-strength password took some time, showing that even moderate")
        print("security can be bypassed with sufficient resources.")
    else:
        print("This strong password resisted the simulation, illustrating the importance")
        print("of using complex, longer passwords for security.")

if __name__ == "__main__":
    main()
