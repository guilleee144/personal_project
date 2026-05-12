
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from routers import npcs as npcs_router
from routers import agent, builds, patches, bosses
from routers import items as items_router
from routers import creatures as creatures_router 


load_dotenv()

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(run_scraper_job, "interval", hours=6, id="reddit_scraper")
    scheduler.start()
    yield
    scheduler.shutdown()

async def run_scraper_job():
    pass  # Desactivado — ahora el scraping es en tiempo real

app = FastAPI(title="The Souls Grail API", lifespan=lifespan)

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
app.include_router(bosses.router)
app.include_router(items_router.router)
app.include_router(npcs_router.router)
app.include_router(creatures_router.router)

@app.get("/")
def root():
    return {"status": "The Erdtree burns eternal"}