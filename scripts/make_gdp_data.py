import json, os, urllib.request

CODES = ["USA", "CHN", "JPN", "DEU", "IND", "GBR", "FRA", "ITA", "BRA", "RUS", "KOR", "CAN"]
NAMES = {"USA": "美国", "CHN": "中国", "JPN": "日本", "DEU": "德国", "IND": "印度", "GBR": "英国",
         "FRA": "法国", "ITA": "意大利", "BRA": "巴西", "RUS": "俄罗斯", "KOR": "韩国", "CAN": "加拿大"}
COLORS = {"USA": "#4f8ef7", "CHN": "#f2554d", "JPN": "#f0a733", "DEU": "#2ecc8f", "IND": "#9b6cf0",
          "GBR": "#22c3d6", "FRA": "#ef5da8", "ITA": "#a3d635", "BRA": "#f97b3d", "RUS": "#8b96a8",
          "KOR": "#19b8a6", "CAN": "#b07cf5"}

YEARS = list(range(2000, 2025))
URL = ("https://api.worldbank.org/v2/country/" + ";".join(CODES) +
       "/indicator/NY.GDP.MKTP.CD?date=2000:2024&format=json&per_page=1000")

raw = json.loads(urllib.request.urlopen(URL, timeout=60).read().decode("utf-8"))[1]
table = {c: {} for c in CODES}
for row in raw:
    if row["value"] is None:
        continue
    table[row["countryiso3code"]][int(row["date"])] = row["value"] / 1e12

out = []
for c in CODES:
    vals = [table[c].get(y) for y in YEARS]
    for i in range(1, len(vals)):
        if vals[i] is None:
            vals[i] = vals[i - 1]
    for i in range(len(vals) - 2, -1, -1):
        if vals[i] is None:
            vals[i] = vals[i + 1]
    vals = [0.0 if v is None else round(v, 3) for v in vals]
    out.append({"code": c, "name": NAMES[c], "color": COLORS[c], "values": vals})

result = {"years": YEARS, "countries": out, "source": "世界银行 NY.GDP.MKTP.CD · 现价美元"}

path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "gdp.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)
print("wrote", path, "countries:", len(out), "years:", len(YEARS))
