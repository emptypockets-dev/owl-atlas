"""Reproduce the pricing tables from the transcribed, source-linked observations.

Standard library only. No network requests, photographs, or site build changes.
Run from any directory: python3 research/market-pricing-2026-09-17/compile.py
"""
import csv
import json
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from statistics import median

ROOT = Path(__file__).resolve().parent
AS_OF = "2026-09-17"
CNG_URLS = json.loads((ROOT / "cng-source-urls.json").read_text())
MAY = "https://coins.ha.com/c/search/results.zx?archive_state=5327&auction_name=232622&auction_year=2026&dept=1909&mode=archive&session_desc=3767&sold_status=1526~1524"
AUG = "https://coins.ha.com/c/search/results.zx?archive_state=5327&auction_name=232635&auction_year=2026&dept=1909&ic4=OtherResults-SampleItem-AuctionNo-051517&mode=archive&sold_status=1526~1524"
JAN24 = "https://coins.ha.com/c/search/results.zx?archive_state=5327&auction_name=232403&auction_year=2024&dept=1909&layout=list&mode=archive&page=10~6&sb=1&si=2&sold_status=1526"
WEIGHT = "https://www.ha.com/c/search/results.zx?archive_state=5327&layout=gallery&mode=archive&page=48~6&sb=1&si=2&sold_status=1526&term=17.18"
YN = "https://www.ha.com/c/search/results.zx?archive_state=5327&layout=gallery&mode=archive&page=48~86&sb=1&si=2&sold_status=1526&term=yn"
NEW = "https://coins.ha.com/c/search/results.zx?archive_state=5327&auction_name=61541&auction_year=2026&dept=1909&ic5=CatalogHome-ActionArea-Cover-071515&mode=archive&sold_status=1526~1524"


def ha(slug, auction, lot):
    return f"https://coins.ha.com/itm/ancients/greek/{slug}/a/{auction}-{lot}.s"


def money(value):
    return float(Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


rows = []


def add(venue, auction, lot, date, family, grade, strike, surface, notes, amount,
        basis, fee, url, cohort, date_basis="lot sold date", evidence="auction reported sold"):
    buyer = money(Decimal(str(amount)) * (1 + Decimal(str(fee)))) if basis == "hammer" else (
        money(amount) if basis == "includes buyer premium" else None)
    rows.append(dict(
        id=f"{venue}-{auction}-{lot}", venue=venue, auction=str(auction), lot=str(lot),
        reported_date=date, date_basis=date_basis, family=family, denomination="AR tetradrachm",
        grade=grade, strike=strike, surface=surface, notes=notes,
        amount=amount, currency="USD", price_basis=basis, buyer_premium_rate=fee,
        buyer_price_before_tax_shipping=buyer, cohort=cohort, evidence=evidence,
        checked_on=AS_OF, source_url=url,
    ))


# Fixed consecutive lot ranges visible in two recent archive pages. These are
# samples, not a claim that every relevant lot in either auction was captured.
current = {
    "232622": [
        [64014,"MS",5,4,"",2135], [64015,"MS",4,4,"",2196],
        [64016,"MS",5,3,"brushed",1708], [64017,"MS",2,4,"flan flaws",1159],
        [64018,"Choice AU",5,4,"",1281], [64019,"Choice AU",5,3,"",1220],
        [64020,"Choice AU",4,4,"",1128.50], [64021,"Choice AU",4,3,"brushed",1128.50],
        [64022,"AU",5,4,"",1586], [64023,"AU",5,3,"brushed",1159],
        [64024,"Choice XF",5,4,"",1037], [64025,"Choice XF",4,4,"",976],
    ],
    "232635": [
        [64008,"MS",5,4,"",2074], [64009,"MS",5,4,"",2074], [64010,"MS",5,4,"",2379],
        [64011,"Choice AU",5,4,"Archive reports sold; cached individual lot page still displays an earlier live bid. Use archive result, not live bid.",1442.04],
        [64012,"Choice AU",5,4,"",1708], [64013,"Choice AU",5,4,"",2074],
        [64014,"Choice AU",5,4,"",1464], [64015,"AU",5,4,"",1464],
        [64016,"AU",5,4,"",1464], [64017,"AU",5,4,"",1586], [64018,"AU",5,4,"",1342],
        [64019,"Choice XF",5,4,"",1067.50], [64020,"Choice XF",5,4,"",1464],
        [64021,"Choice XF",5,4,"",1067.50], [64022,"Choice XF",5,4,"",1220],
        [64023,"Choice XF",5,3,"brushed",1006.50],
    ],
}
for auction, lots in current.items():
    for lot, grade, strike, surface, notes, price in lots:
        add("Heritage", auction, lot, "2026-05-28" if auction == "232622" else "2026-08-27",
            "Classical mass issue", grade, strike, surface, notes, price,
            "includes buyer premium", 0.22, MAY if auction == "232622" else AUG,
            "current consecutive lots", "archive auction end date; individual session may be previous day")


# Historical comparators: same house, denomination, mass-issue attribution,
# adjectival grade and strike/surface scores. Not randomly selected or exhaustive.
historical = [
    ["3076",33044,"2019-09-09",528,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1717-gm-9h-ngc-choice-xf-5-5-4-5"],
    ["231949",61046,"2019-12-05",660,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1717-gm-2h-ngc-choice-xf-5-5-4-5"],
    ["232033",62057,"2020-08-12",840,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1714-gm-5h-ngc-choice-xf-5-5-4-5"],
    ["232052",64057,"2020-12-23",720,"attica-athens-ca-440-404-bc-ar-tetradrachm-26mm-1712-gm-8h-ngc-choice-xf-5-5-4-5"],
    ["232123",62095,"2021-06-09",630,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1715-gm-1h-ngc-choice-xf-5-5-4-5"],
    ["232126",61102,"2021-06-30",750,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1716-gm-8h-ngc-choice-xf-5-5-4-5"],
    ["232114",62102,"2021-04-07",750,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1718-gm-9h-ngc-choice-xf-5-5-4-5"],
    ["232106",62081,"2021-02-11",900,WEIGHT],
    ["232133",63097,"2021-08-18",900,YN],
    ["232217",64116,"2022-04-27",660,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1718-gm-7h-ngc-choice-xf-5-5-4-5"],
    ["232230",64069,"2022-07-27",660,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1718-gm-1h-ngc-choice-xf-5-5-4-5"],
    ["232311",63032,"2023-03-15",900,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1714-gm-2h-ngc-choice-xf-5-5-4-5"],
    ["232344",61036,"2023-11-01",720,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1718-gm-4h-ngc-choice-xf-5-5-4-5"],
    ["232341",62038,"2023-10-11",900,YN],
    ["232403",63026,"2024-01-18",750,JAN24],
    ["232450",62026,"2024-12-11",780,"attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1721-gm-11h-ngc-choice-xf-5-5-4-5"],
    ["232449",61029,"2024-12-04",900,"ancients-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1719-gm-8h-ngc-choice-xf-5-5-4-5"],
    ["232527",61037,"2025-07-02",960,"greek-attica-athens-ca-440-404-bc-ar-tetradrachm-25mm-1719-gm-8h-ngc-choice-xf-5-5-4-5"],
    ["232544",65028,"2025-10-29",990,"greek-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1720-gm-10h-ngc-choice-xf-5-5-4-5"],
]
for auction, lot, date, price, slug in historical:
    url = slug if slug.startswith("https:") else ha(slug, auction, lot)
    note = ""
    date_basis = "lot sold date"
    if auction == "232403":
        note = "2025 catalogue identifies this earlier lot as the same coin. Earlier archive ends Jan 18; later provenance cites Jan 17."
        date_basis = "archive auction end date"
    if auction == "232527":
        note = "Catalogue provenance: Heritage 232403, lot 63026, Jan 17 2024. Same 25mm, 17.19g, 8h and NGC grade; identity is catalogue-linked, not independently certified here."
    if auction == "232449":
        note = "cabinet toning"
    if slug in (WEIGHT, YN):
        date_basis = "archive auction end date"
    add("Heritage", auction, lot, date, "Classical mass issue", "Choice XF", 5, 4,
        note, price, "includes buyer premium", 0.20, url, "historical matched grade", date_basis)


# CNG raw coins broaden the current sample beyond Heritage's slabbed offerings.
# Source pages explicitly give hammer-only prices and a 20% buyer fee.
cng = [
    [614,106,"2026-07-29","Classical mass issue","VF","Rough/granular surfaces; find patina; 15.50g",375,202608],
    [613,156,"2026-07-15","Classical mass issue","Good VF","Light cleaning marks; 17.15g",650,201456],
    [616,257,"2026-09-02","Classical mass issue","VF","Rough surfaces; horn silver; delaminations; 16.39g",475,205601],
    [610,204,"2026-06-03","Classical mass issue","Good VF","Granular surfaces; 16.97g",650,197161],
    [611,187,"2026-06-17","Classical mass issue","Good VF","Light earthen deposits; 17.18g",900,198389],
    [612,89,"2026-07-01","Pi style","Good VF","Pi V; worn obverse die; 17.15g",350,199709],
    [613,160,"2026-07-15","Quadridigite","VF","Deposits, marks and scrapes; 17.15g; Pitchfork provenance",475,201460],
]
for auction, lot, date, family, grade, notes, price, record in cng:
    add("CNG", auction, lot, date, family, grade, None, None, notes, price,
        "hammer", 0.20, CNG_URLS[str(record)],
        "current raw examples" if family == "Classical mass issue" else "other families")


premium = [
    ["61626",23039,"2026-06-07","Choice VF",3416,"Full Crest; star; brushed","greek-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1718-gm-4h-ngc-choice-vfand-9733-5-5-4-5-full-crest-brushed"],
    ["232617",64024,"2026-04-22","AU",3172,"Full Crest","greek-attica-athens-ca-440-404-bc-ar-tetradrachm-23mm-1718-gm-11h-ngc-au-5-5-4-5-full-crest"],
    ["61626",23038,"2026-06-07","AU",2928,"Full Crest","greek-attica-athens-ca-440-404-bc-ar-tetradrachm-24mm-1715-gm-10h-ngc-au-5-5-4-5-full-crest"],
]
for auction, lot, date, grade, price, note, slug in premium:
    add("Heritage", auction, lot, date, "Classical mass issue", grade, 5, 4, note,
        price, "includes buyer premium", 0.22, ha(slug, auction, lot), "full crest examples")


other = [
    ["232635",64024,"2026-08-27","Pi style","MS",4,4,"353–294 BCE catalogue range",793,AUG],
    ["232635",64025,"2026-08-27","Pi style","Choice AU",3,3,"353–294 BCE catalogue range",549,AUG],
    ["61541",25003,"2026-08-31","New Style","Fine",5,2,"2nd–1st centuries BCE; exact issue not normalized",610,NEW],
    ["61541",25011,"2026-08-31","New Style","Choice XF",5,2,"2nd–1st centuries BCE; exact issue not normalized",1464,NEW],
    ["61626",23036,"2026-06-07","Early classical / Starr V","Choice AU",5,3,"465–455 BCE catalogue range; Penn/NAC provenance; hematite toning",2928,ha("greek-attica-athens-ca-465-455-bc-ar-tetradrachm-25mm-1696-gm-1h-ngc-choice-au-5-5-3-5","61626",23036)],
    ["232616",63054,"2026-04-15","Early classical / Starr IV","Choice VF",4,3,"475–465 BCE catalogue range; scuffs",1464,ha("greek-attica-athens-ca-475-465-bc-ar-tetradrachm-24mm-1722-gm-1h-ngc-choice-vf-4-5-3-5-scuffs","232616",63054)],
    ["3130",36022,"2026-01-22","Archaic","VF",4,5,"Seltman C; catalogue 510/500–480 BCE; flan flaw; light-weight 16.38g",6710,ha("greek-attica-athens-ca-510-500-480-bc-ar-light-weight-specimen-tetradrachm-21mm-1638-gm-11h-ngc-vf-4-5-5-","3130",36022)],
]
for auction, lot, date, family, grade, strike, surface, notes, price, url in other:
    add("Heritage", auction, lot, date, family, grade, strike, surface, notes, price,
        "includes buyer premium", 0.22, url, "other families",
        "archive auction end date" if url in (AUG, NEW) else "lot sold date")


# Public eBay displays are retained as observations, not verified transaction
# prices. They must never enter the auction medians or inferred hammer values.
add("eBay", "listing", "267600423498", "2026-07-02", "Classical mass issue", "AU", None, None,
    "Sold banner; or Best Offer; relisted-item notice. Actual accepted offer and completed payment not verified. NGC certificate 8233610-215.",
    2338.20, "public displayed price; actual transaction unverified", None,
    "https://www.ebay.com/itm/267600423498", "eBay unverified", evidence="public sold listing with Best Offer")
add("eBay", "listing", "318418658588", "2026-08-01", "Pi style", "Choice AU", None, None,
    "Sold banner; no Best Offer displayed in retrieved page; actual payment not verified. Shipping displayed $5.99. Title gives 353–294 BCE; item-condition field says AU58, not adopted as an ancient-coin grade.",
    999.99, "public displayed price; actual transaction unverified", None,
    "https://www.ebay.com/itm/318418658588", "eBay unverified", evidence="public sold listing")


def stats(selected):
    values = [r["buyer_price_before_tax_shipping"] for r in selected]
    assert values and all(v is not None for v in values)
    return dict(n=len(values), minimum=min(values), median=money(median(values)), maximum=max(values))


assert len({r["id"] for r in rows}) == len(rows)
assert len([r for r in rows if r["cohort"] == "current consecutive lots"]) == 28
assert all(r["buyer_price_before_tax_shipping"] is None for r in rows if r["venue"] == "eBay")
assert all(r["reported_date"] <= AS_OF and r["amount"] > 0 for r in rows)

year_groups = defaultdict(list)
for row in rows:
    if row["cohort"] in ("current consecutive lots", "historical matched grade") and row["grade"] == "Choice XF" and row["strike"] == 5 and row["surface"] == 4:
        year_groups[row["reported_date"][:4]].append(row)
trend = {year: stats(group) for year, group in sorted(year_groups.items())}

core = [r for r in rows if r["cohort"] == "current consecutive lots"]
current_stats = {grade: stats([r for r in core if r["grade"] == grade]) for grade in ("Choice XF", "AU", "Choice AU", "MS")}
current_stats["MS without listed problems"] = stats([r for r in core if r["grade"] == "MS" and not r["notes"]])
current_stats["Raw VF/Good VF examples"] = stats([r for r in rows if r["cohort"] == "current raw examples"])
summary = dict(as_of=AS_OF, total_observations=len(rows), auction_observations=sum(r["venue"] != "eBay" for r in rows),
               ebay_observations=sum(r["venue"] == "eBay" for r in rows), current=current_stats,
               matched_grade_by_year=trend,
               repeat_sale=dict(earlier_id="Heritage-232403-63026", later_id="Heritage-232527-61037", buyer_price_change_percent=28,
                                basis="Catalogue-linked identity; both reported prices include 20% premium. Not a net return."))
(ROOT / "sales.json").write_text(json.dumps(dict(as_of=AS_OF, records=rows), indent=2, ensure_ascii=False) + "\n")
(ROOT / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
with (ROOT / "sales.csv").open("w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)


def usd(value):
    return f"${value:,.2f}" if value % 1 else f"${value:,.0f}"


tables = ["# Recomputed sample statistics", "", "USD, including buyer premium; before tax and shipping.", "",
          "| Current sample | n | Minimum | Median | Maximum |", "| --- | ---: | ---: | ---: | ---: |"]
for label, s in current_stats.items():
    tables.append(f"| {label} | {s['n']} | {usd(s['minimum'])} | {usd(s['median'])} | {usd(s['maximum'])} |")
tables += ["", "Same reported grade: Heritage classical mass issues, NGC Choice XF, strike 5/5, surface 4/5.", "",
           "| Year | n | Minimum | Median | Maximum |", "| --- | ---: | ---: | ---: | ---: |"]
for year, s in trend.items():
    tables.append(f"| {year} | {s['n']} | {usd(s['minimum'])} | {usd(s['median'])} | {usd(s['maximum'])} |")
tables += ["", "These are observed sample statistics, not population estimates, an appraisal, or an investment index.", ""]
(ROOT / "tables.md").write_text("\n".join(tables))
print(json.dumps(summary, indent=2))
