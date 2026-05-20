from app.db.session import engine
from app.db.models import Base

def init_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
