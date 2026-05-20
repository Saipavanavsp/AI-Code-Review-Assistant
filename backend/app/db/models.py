from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    url = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    reviews = relationship("ReviewLog", back_populates="repository")
    metrics = relationship("Metric", back_populates="repository")

class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    face_type = Column(String)  # "BATCH" or "LIVE"
    file_path = Column(String)
    commit_sha = Column(String, nullable=True)
    score = Column(Float)
    findings = Column(JSON)  # Structured 10-step template results
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    repository = relationship("Repository", back_populates="reviews")

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(Integer, primary_key=True, index=True)
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    code_quality_score = Column(Float)
    defect_density = Column(Float)
    security_vulnerabilities = Column(Integer)  # Count of OWASP/etc
    complexity_index = Column(Float)
    
    repository = relationship("Repository", back_populates="metrics")
