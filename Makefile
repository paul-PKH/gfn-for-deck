.PHONY: build watch clean install update-db package

# Default target
all: build

# Build the plugin
build:
	@echo "Building plugin..."
	npm run build
	@echo "Build complete!"

# Watch mode for development
watch:
	@echo "Starting watch mode..."
	npm run watch

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist/
	@echo "Clean complete!"

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install
	@echo "Dependencies installed!"

# Update games database
update-db:
	@echo "Updating GFN games database..."
	python3 scripts/update_games_db.py
	@echo "Database update complete!"

# Package for manual installation via USB
package:
	@echo "Packaging for manual installation..."
	@bash scripts/package-for-deck.sh

# Deploy to Steam Deck (requires SSH setup)
deploy:
	@echo "Deploying to Steam Deck..."
	@if [ -z "$(DECK_IP)" ]; then \
		echo "Error: DECK_IP not set. Usage: make deploy DECK_IP=192.168.x.x"; \
		exit 1; \
	fi
	@echo "Building plugin..."
	@npm run build
	@echo "Bundling Python dependencies..."
	@bash scripts/bundle-python-deps.sh
	@echo "Copying to Steam Deck at $(DECK_IP)..."
	@scp -r dist plugin.json main.py defaults py_modules deck@$(DECK_IP):~/homebrew/plugins/gfn-for-deck/
	@echo "Deployed! Restart Decky Loader on your Steam Deck."

# Help
help:
	@echo "Available targets:"
	@echo "  make build     - Build the plugin"
	@echo "  make watch     - Watch for changes and rebuild"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make install   - Install dependencies"
	@echo "  make update-db - Update GFN games database from online sources"
	@echo "  make package   - Package for manual USB installation"
	@echo "  make deploy    - Deploy to Steam Deck (set DECK_IP=x.x.x.x)"
	@echo "  make help      - Show this help message"
