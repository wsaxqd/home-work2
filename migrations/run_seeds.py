#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Seed Runner for AI Universal Education Platform

Usage:
    python run_seeds.py              # Run all base seeds
    python run_seeds.py --dev        # Run base + dev seeds
    python run_seeds.py --target=plans   # Run only matching file(s)
    python run_seeds.py --target=plans --dev  # Match in both base and dev
    python run_seeds.py --list       # List all available seed files
    python run_seeds.py --dry-run    # Show what would be executed
"""

import argparse
import os
import subprocess
import sys

# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "port": "5435",
    "user": "admin",
    "password": "secure_pass",
    "database": "postgres",
    "container": "ai_universal_edu",
}

# Seed directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SEEDS_DIR = os.path.join(SCRIPT_DIR, "seeds")
BASE_DIR = os.path.join(SEEDS_DIR, "base")
DEV_DIR = os.path.join(SEEDS_DIR, "dev")


def get_seed_files(directory, target=None):
    """Get SQL files from directory, optionally filtered by target."""
    if not os.path.exists(directory):
        return []

    files = sorted([
        os.path.join(directory, f)
        for f in os.listdir(directory)
        if f.endswith(".sql")
    ])

    if target:
        files = [f for f in files if target.lower() in os.path.basename(f).lower()]

    return files


def execute_sql_file(file_path, dry_run=False):
    """Execute a SQL file using docker exec."""
    filename = os.path.basename(file_path)
    prefix = "[DRY-RUN] " if dry_run else ""
    print("{}Executing: {}".format(prefix, filename))

    if dry_run:
        return True

    try:
        cmd = [
            "docker", "exec", "-i", DB_CONFIG["container"],
            "psql",
            "-U", DB_CONFIG["user"],
            "-d", DB_CONFIG["database"],
            "-f", "-"
        ]

        with open(file_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        env = os.environ.copy()
        env["PGPASSWORD"] = DB_CONFIG["password"]

        result = subprocess.run(
            cmd,
            input=sql_content,
            capture_output=True,
            text=True,
            env=env
        )

        if result.returncode != 0:
            print("  [ERROR] {}".format(result.stderr.strip()))
            return False

        output_lines = result.stdout.strip().split("\n")
        for line in output_lines[-3:]:
            if line.strip():
                print("  {}".format(line))

        print("  [OK] {}".format(filename))
        return True

    except FileNotFoundError:
        print("  [ERROR] Docker not found. Make sure Docker is installed and running.")
        return False
    except Exception as e:
        print("  [ERROR] {}".format(e))
        return False


def list_seeds(include_dev=False, target=None):
    """List all available seed files."""
    print("\n=== Available Seed Files ===\n")

    print("[base/]")
    base_files = get_seed_files(BASE_DIR, target)
    if base_files:
        for f in base_files:
            print("  - {}".format(os.path.basename(f)))
    else:
        print("  (no files)")

    if include_dev or target:
        print("\n[dev/]")
        dev_files = get_seed_files(DEV_DIR, target)
        if dev_files:
            for f in dev_files:
                print("  - {}".format(os.path.basename(f)))
        else:
            print("  (no files)")

    print()


def run_seeds(include_dev=False, target=None, dry_run=False):
    """Run seed files and return exit code."""
    files_to_run = []

    base_files = get_seed_files(BASE_DIR, target)
    files_to_run.extend(base_files)

    if include_dev:
        dev_files = get_seed_files(DEV_DIR, target)
        files_to_run.extend(dev_files)

    if not files_to_run:
        if target:
            print("No seed files matching '{}' found.".format(target))
        else:
            print("No seed files found.")
        return 1

    print("\n" + "=" * 50)
    print("  Database Seed Runner")
    print("=" * 50)
    mode = "Development" if include_dev else "Production (base only)"
    print("  Mode: {}".format(mode))
    print("  Target: {}".format(target or "all"))
    print("  Files: {}".format(len(files_to_run)))
    if dry_run:
        print("  ** DRY RUN - No changes will be made **")
    print("=" * 50 + "\n")

    success_count = 0
    fail_count = 0

    for file_path in files_to_run:
        if execute_sql_file(file_path, dry_run):
            success_count += 1
        else:
            fail_count += 1

    print("\n" + "-" * 50)
    print("  Completed: {} succeeded, {} failed".format(success_count, fail_count))
    print("-" * 50 + "\n")

    return 0 if fail_count == 0 else 1


def main():
    parser = argparse.ArgumentParser(
        description="Run database seed files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        "--dev",
        action="store_true",
        help="Include dev/ seed files (for development environment)"
    )

    parser.add_argument(
        "--target",
        type=str,
        metavar="NAME",
        help="Only run seed files matching NAME (e.g., --target=plans)"
    )

    parser.add_argument(
        "--list",
        action="store_true",
        dest="list_files",
        help="List available seed files without executing"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be executed without making changes"
    )

    args = parser.parse_args()

    if args.list_files:
        list_seeds(include_dev=args.dev, target=args.target)
        return 0

    return run_seeds(
        include_dev=args.dev,
        target=args.target,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    sys.exit(main())
