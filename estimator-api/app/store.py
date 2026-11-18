import os
import sqlite3
import threading
from pathlib import Path

from app.schemas import HousingFeatures


def database_path() -> Path:
    override = os.environ.get("ESTIMATES_DB_PATH")
    if override:
        return Path(override)
    return Path(__file__).resolve().parents[2] / "data" / "estimates.db"


class EstimateStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = path or database_path()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS estimates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    created_at TEXT NOT NULL,
                    label TEXT,
                    square_footage REAL NOT NULL,
                    bedrooms INTEGER NOT NULL,
                    bathrooms REAL NOT NULL,
                    year_built INTEGER NOT NULL,
                    lot_size REAL NOT NULL,
                    distance_to_city_center REAL NOT NULL,
                    school_rating REAL NOT NULL,
                    predicted_price REAL NOT NULL
                )
                """
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, check_same_thread=False)
        connection.row_factory = sqlite3.Row
        return connection

    def insert(
        self,
        created_at: str,
        label: str | None,
        features: HousingFeatures,
        predicted_price: float,
    ) -> int:
        with self._lock, self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO estimates (
                    created_at, label, square_footage, bedrooms, bathrooms,
                    year_built, lot_size, distance_to_city_center, school_rating,
                    predicted_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    created_at,
                    label,
                    features.square_footage,
                    features.bedrooms,
                    features.bathrooms,
                    features.year_built,
                    features.lot_size,
                    features.distance_to_city_center,
                    features.school_rating,
                    predicted_price,
                ),
            )
            return int(cursor.lastrowid)

    def list_all(self) -> list[sqlite3.Row]:
        with self._lock, self._connect() as connection:
            return list(connection.execute("SELECT * FROM estimates ORDER BY id DESC"))

    def get_many(self, ids: list[int]) -> list[sqlite3.Row]:
        placeholders = ",".join("?" for _ in ids)
        with self._lock, self._connect() as connection:
            return list(
                connection.execute(
                    f"SELECT * FROM estimates WHERE id IN ({placeholders})",
                    ids,
                )
            )
