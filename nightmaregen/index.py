import time
import urllib.request
import json
import uuid
import random
from datetime import datetime
from collections import deque

url = "https://dglm65hpgq6w7kpxaxxugbypqy0gjdni.lambda-url.ap-southeast-1.on.aws/"

pending = deque(maxlen=27)

while True:
    time.sleep(27)
    account_id = None
    if random.choice([True, False]):
        with urllib.request.urlopen(url) as response:
            data = response.read().decode("utf-8")
            account_id = json.loads(data)["id"]
    else:
        try:
            account_id = pending.pop()
        except:
            pass
    if account_id != None:
        random_status = random.choice(["completed", "pending", "failed"])
        if random_status == "pending":
            pending.append(account_id)
            continue
        generated_uuid = str(uuid.uuid4())
        output = {
            "id": generated_uuid,
            "account_id": account_id,
            "type": random.choice(["D", "W"]),
            "amount": round(random.uniform(0, 100000), 2),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": random_status
        }
        with open(f"processing/{generated_uuid}.txt", 'w') as file:
            json.dump(output, file)
