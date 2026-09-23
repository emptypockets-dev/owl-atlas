"""Verify that every new exhibit preserves the supplied research manifest.

This is data-integrity checking, not independent source or photograph verification.
Run from any directory: python tests/integration_data.py
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/content.json').read_text())
research = json.loads((ROOT / 'research/pi-later-old-findings.json').read_text())
checks = []

def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)

for source in research['specimens']:
    specimen = data['specimens'][source['id']]
    for key, source_key in [('accession','accession'), ('objectUrl','record_url'),
                            ('catalogueDate','catalogue_date'), ('dateNote','date_note'),
                            ('weightG','weight_g'), ('diameterMm','diameter_mm')]:
        check(specimen[key] == source[source_key], f'{source["id"]}: preserved {key}')
    for photo in source['images']:
        side = photo['side']
        image = data['images'][specimen[side]]
        for key, source_key in [('url','image_url'), ('source','file_record'),
                                ('width','width'), ('height','height')]:
            check(image[key] == photo[source_key], f'{source["id"]}/{side}: preserved {key}')
        check(image['objectUrl'] == source['record_url'], f'{source["id"]}/{side}: exact object link')
        check(image['credit'] == source['credit'], f'{source["id"]}/{side}: full credit')
        check(image['crop'] == 'none', f'{source["id"]}/{side}: full source frame')
        check(image['reuseStatus'] == 'review-pending', f'{source["id"]}/{side}: unresolved rights retained')
        check(image['rightsPolicyUrl'] == research['rights_policy_url'], f'{source["id"]}/{side}: reuse policy retained')
        check(not image['localOriginalDownloaded'], f'{source["id"]}/{side}: download status not overstated')

check(all(family['obverse'] for family in data['families']), 'Every main family now has an obverse reference')
# The early-classical reverse is now sourced to the existing specimen, not a substitute.
early = json.loads((ROOT / 'research/early-classical-findings.json').read_text())
family = next(item for item in data['families'] if item['id'] == 'early-classical')
check(family['obverse'] == 'early-athena' and family['reverse'] == 'early-owl', 'Early-classical pair uses the researched photographs')
for side in ['obverse', 'reverse']:
    metadata = early['museumMetadata'][side]
    check(metadata['cover_accession_number'] == '1920.267', f'Early classical/{side}: museum confirms the same parent accession')
    check(metadata['share_license_status'] == 'CC0', f'Early classical/{side}: museum CC0 designation preserved')
check(data['images']['early-owl'] == early['imageRecord'], 'Early-classical reverse matches documented source and delivery records')
for fid in ['pi','late-old']:
    family = next(item for item in data['families'] if item['id'] == fid)
    check(bool(family['obverse'] and family['reverse']), f'{fid}: both formerly missing sides integrated')
check(len(data['images']) == 18, 'Original 16 images plus the documented early-classical reverse and the Laurion ore photograph')
check(len(data['sources']) == 51, '51 source records, including eight market references, the nine shareable-fact references the creator kit cites and the Laurion cupellation study')
check(len(data['specimens']) == 3, 'Three BnF specimen records')
check(not any(i['url'] == research['additional_catalogue_lead']['image_url'] for i in data['images'].values()), 'Low-resolution heterogeneous preview not substituted')

report = {'result':'pass', 'checks':len(checks), 'items':checks,
          'limitations':['Checks preserve the preceding research manifest; no new independent numismatic attribution is claimed.',
                         'This local data test does not verify remote photograph delivery; see the separate hosted-browser report.',
                         'Six BnF image reuse statuses remain review-pending.']}
(ROOT/'research/integration-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(f'PASS: {len(checks)} research-manifest consistency checks.')
