.PHONY: run test lint openapi migrate revision

run:
	uvicorn app.main:app --reload

test:
	pytest -q

lint:
	ruff check . && black --check .

openapi:
	python -c "import json; from app.main import app; open('openapi.json','w').write(json.dumps(app.openapi(), indent=2) + '\n')"

migrate:
	alembic upgrade head

# usage: make revision m="add emails table"
revision:
	alembic revision --autogenerate -m "$(m)"
