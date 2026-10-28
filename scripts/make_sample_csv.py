import json, csv, io
d = json.load(open("src/gdp.json", encoding="utf-8"))
years = d["years"]
with open("public/sample-data.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["名称"] + years)
    for c in d["countries"]:
        w.writerow([c["name"]] + c["values"])
print("rows", len(d["countries"]), "cols", len(years))
