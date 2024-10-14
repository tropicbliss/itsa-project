import time
import urllib.request
import json
import uuid
import random
from datetime import datetime

url = "https://dglm65hpgq6w7kpxaxxugbypqy0gjdni.lambda-url.ap-southeast-1.on.aws/"

while True:
    with urllib.request.urlopen(url) as response:
        data = response.read().decode("utf-8")
        account_id = json.loads(data)
    if account_id != None:
        generated_uuid = str(uuid.uuid4())
        output = {
            "id": generated_uuid,
            "account_id": account_id,
            "type": random.choice(["D", "W"]),
            "amount": round(random.uniform(0, 100000), 2),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "status": "completed"
        }
        with open(f"processing/{generated_uuid}.txt", 'w') as file:
            json.dump(output, file)
    time.sleep(27)
