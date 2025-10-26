import asyncio
import json
from aiocouch import CouchDB
from redis.asyncio import Redis

redis_client = Redis(host="localhost", port=6379, db=0)
async def getMovie(doc_id: str):

    cache_key = f"_id: {doc_id}"

    cached = await redis_client.get(cache_key)
    if cached:
        print(f"Cache hit for {doc_id}")
        return json.loads(cached)
    print(f"Cache miss for {doc_id}, querying CouchDB...")

    async with CouchDB("http://admin:admin@localhost:5984") as couchdb:
        db = await couchdb["netflix_titles"]
        doc = await db[doc_id]
        doc_data = dict(doc)


    await redis_client.setex(cache_key, 60, json.dumps(doc_data))
    return doc_data

async def main():
    result1 = await getMovie("03972a1bf867475685df79fe80000602")
    print("Result 1:", result1)

    result2 = await getMovie("03972a1bf867475685df79fe80000602")
    print("Result 2:", result2)

    await redis_client.close()

asyncio.run(main())
