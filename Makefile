.PHONY: help build up down test seed reset demo-concurrency demo-smoke

help:
	@echo "TrustLine Infrastructure Commands:"
	@echo "  make build             - Build docker containers"
	@echo "  make up                - Start system in docker compose"
	@echo "  make down              - Stop docker containers"
	@echo "  make test              - Run pytest backend test suite"
	@echo "  make seed              - Run demo seeding script"
	@echo "  make reset             - Reset and re-seed clean database state"
	@echo "  make demo-concurrency  - Run parallel race condition test script"
	@echo "  make demo-smoke        - Run end-to-end smoke test suite"

build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

test:
	pytest backend/tests

seed:
	python scripts/seed_demo.py

reset:
	python scripts/demo_reset.py

demo-concurrency:
	python scripts/demo_concurrency.py http://localhost:8000

demo-smoke:
	python scripts/demo_smoke.py http://localhost:8000
