# ==================================================
# Makefile – KreaLabs Flow
# ==================================================

# Variables
DOCKER_COMPOSE_DEV = docker-compose.dev.yml
DOCKER_COMPOSE_PROD = docker-compose.yml
APP_CONTAINER = app
SCHEMA = src/db/schema.ts
MIGRATIONS_DIR = migrations

# --------------------------------------------------
# Docker Compose Dev
# --------------------------------------------------
dev-up:
	docker compose -f $(DOCKER_COMPOSE_DEV) up -d

dev-down:
	docker compose -f $(DOCKER_COMPOSE_DEV) down

dev-logs:
	docker compose -f $(DOCKER_COMPOSE_DEV) logs -f $(APP_CONTAINER)

dev-restart: dev-down dev-up

# --------------------------------------------------
# Docker Compose Prod
# --------------------------------------------------
prod-up:
	docker compose -f $(DOCKER_COMPOSE_PROD) up -d --build

prod-down:
	docker compose -f $(DOCKER_COMPOSE_PROD) down

prod-logs:
	docker compose -f $(DOCKER_COMPOSE_PROD) logs -f $(APP_CONTAINER)

prod-restart: prod-down prod-up

# --------------------------------------------------
# Next.js inside Docker (exec in app container)
# --------------------------------------------------
app-shell:
	docker compose -f $(DOCKER_COMPOSE_DEV) exec $(APP_CONTAINER) sh

app-install:
	docker compose -f $(DOCKER_COMPOSE_DEV) exec $(APP_CONTAINER) pnpm install

app-dev:
	docker compose -f $(DOCKER_COMPOSE_DEV) exec $(APP_CONTAINER) pnpm dev

app-build:
	docker compose -f $(DOCKER_COMPOSE_PROD) exec $(APP_CONTAINER) pnpm build

app-start:
	docker compose -f $(DOCKER_COMPOSE_PROD) exec $(APP_CONTAINER) pnpm start

# --------------------------------------------------
# Drizzle ORM
# --------------------------------------------------
drizzle-generate:
	docker compose -f $(DOCKER_COMPOSE_DEV) exec $(APP_CONTAINER) pnpm drizzle-kit generate --schema $(SCHEMA) --out $(MIGRATIONS_DIR)

drizzle-push:
	docker compose -f $(DOCKER_COMPOSE_DEV) exec $(APP_CONTAINER) pnpm drizzle-kit push --schema $(SCHEMA) --out $(MIGRATIONS_DIR)

# --------------------------------------------------
# Helpers
# --------------------------------------------------
ps:
	docker compose -f $(DOCKER_COMPOSE_DEV) ps

stop-all:
	docker compose -f $(DOCKER_COMPOSE_DEV) down
	docker compose -f $(DOCKER_COMPOSE_PROD) down