import os
from supabase import create_client, Client

def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    print(f"URL: {url}")
    print(f"KEY: {key[:10] if key else 'NONE'}")
    return create_client(url, key)