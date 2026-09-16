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
# The early-classical entry only had an obverse in edition 01; do not invent its reverse.
for fid in ['pi','late-old']:
    family = next(item for item in data['families'] if item['id'] == fid)
    check(bool(family['obverse'] and family['reverse']), f'{fid}: both formerly missing sides integrated')
check(len(data['images']) == 16, 'Six additions, 16 total image records')
check(len(data['sources']) == 28, '28 source records')
check(len(data['specimens']) == 3, 'Three BnF specimen records')
check(not any(i['url'] == research['additional_catalogue_lead']['image_url'] for i in data['images'].values()), 'Low-resolution heterogeneous preview not substituted')

report = {'result':'pass', 'checks':len(checks), 'items':checks,
          'limitations':['Checks preserve the preceding research manifest; no new independent numismatic attribution is claimed.',
                         'No remote photograph bytes were obtained or reverified in this environment.',
                         'Six BnF image reuse statuses remain review-pending.']}
(ROOT/'research/integration-qa.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(f'PASS: {len(checks)} research-manifest consistency checks.')
