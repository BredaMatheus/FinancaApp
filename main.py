from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from pydantic import BaseModel
from datetime import date

# cria tabela no banco
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# schema
class TransacaoCreate(BaseModel):
    descricao: str
    valor: float
    tipo: str
    categoria: str
    data: date

# dependência de banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# POST
@app.post("/transacoes")
def criar_transacao(transacao: TransacaoCreate, db: Session = Depends(get_db)):
    nova = models.Transacao(
    descricao=transacao.descricao,
    valor=transacao.valor,
    tipo=transacao.tipo,
    categoria=transacao.categoria,
    data=transacao.data
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

# GET
@app.get("/transacoes")
def listar_transacoes(db: Session = Depends(get_db)):
    return db.query(models.Transacao).all()

# SALDO
@app.get("/saldo")
def calcular_saldo(db: Session = Depends(get_db)):
    transacoes = db.query(models.Transacao).all()

    entradas = sum(t.valor for t in transacoes if t.tipo == "entrada")
    saidas = sum(t.valor for t in transacoes if t.tipo == "saida")

    saldo = entradas - saidas

    return {
        "total_entradas": entradas,
        "total_saidas": saidas,
        "saldo": saldo
    }
    
# DELETE
@app.delete("/transacoes/{id}")
def deletar_transacao(id: int, db: Session = Depends(get_db)):
    transacao = db.query(models.Transacao).filter(models.Transacao.id == id).first()

    if not transacao:
        return {"erro": "Transação não encontrada"}

    db.delete(transacao)
    db.commit()

    return {"mensagem": "Transação deletada com sucesso"}

# UPDATE
@app.put("/transacoes/{id}")
def atualizar_transacao(id: int, transacao: TransacaoCreate, db: Session = Depends(get_db)):
    transacao_db = db.query(models.Transacao).filter(models.Transacao.id == id).first()

    if not transacao_db:
        return {"erro": "Transação não encontrada"}

    transacao_db.descricao = transacao.descricao
    transacao_db.valor = transacao.valor
    transacao_db.tipo = transacao.tipo
    transacao_db.categoria = transacao.categoria
    transacao_db.data = transacao.data

    db.commit()
    db.refresh(transacao_db)

    return transacao_db