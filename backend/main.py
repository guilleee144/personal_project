from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import agent, builds, patches

load_dotenv()

app = FastAPI(title="The Souls Grail")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent.router)
app.include_router(builds.router)
app.include_router(patches.router)

@app.get("/")
def root():
    return {"status": "The Erdtree burns eternal"}