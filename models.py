from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String)
    valor = Column(Float)
    tipo = Column(String)
    categoria = Column(String)
    data = Column(Date)  