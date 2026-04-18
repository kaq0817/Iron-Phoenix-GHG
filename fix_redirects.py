import csv
import re

BASE = 'https://www.ourphoenixrise.com'

DEPT = {
    'gaming':    BASE + '/collections/gamer-lifestyle-gear-apparel-unique-loot',
    'sports':    BASE + '/collections/active-performance-living',
    'home':      BASE + '/collections/home-decor-cozy-living',
    'jewelry':   BASE + '/collections/timeless-jewelry-co',
    'kids':      BASE + '/collections/blossom-fields-children',
    'wellness':  BASE + '/collections/relax-and-daily-rituals',
    'americana': BASE + '/collections/americana-front-porch',
    'apparel':   BASE + '/collections/fabulous-finds',
    'blog':      BASE + '/blogs/exciting-merchandise',
    'new':       BASE + '/collections/newest-arrivals',
}

# Old collection handle -> department key
COLLECTION_MAP = {
    # Gaming / streaming / tech
    'gamer-grotto':                               'gaming',
    'gamer-grotto-home-decor':                    'gaming',
    'gamer-pet-accessories':                      'gaming',
    'gamer-tag-pajama-bliss':                     'gaming',
    'gamers-lair':                                'gaming',
    'gamers-paradise-gaming-merchandise':         'gaming',
    'gaming-accessories':                         'gaming',
    'gaming-gear-and-lifestyle':                  'gaming',
    'gaming-gear-gamers-paradise':                'gaming',
    'gaming-hardware':                            'gaming',
    'gaming-inspired-coffee-mugs':                'gaming',
    'gaming-merch':                               'apparel',
    'live-streamer-also-gamer-goodies':           'gaming',
    'live-streamer-comfortable-gamer-goodies':    'gaming',
    'live-streamer-gamer-goodies':                'gaming',
    'sci-fi-creative-universe':                   'gaming',
    'streamer-comfortable-gamer-goodies':         'gaming',
    'streamer-gamer-gamer-goodies':               'gaming',
    'streamer-tools':                             'gaming',
    'travel-collection-for-gaming-influencers':   'gaming',
    'work-stream-ready':                          'wellness',
    'frost-pulse-gear-vibe':                      'gaming',
    'adventure-tech-tools':                       'gaming',
    'thoughtful-gifts-gadgets':                   'gaming',

    # Sports / outdoor / active
    'active-outdoors-sports-gear':                'sports',
    'adventure-essentials':                       'sports',
    'affordable-fishing-gear':                    'sports',
    'athletic-shorts':                            'sports',
    'auto-hobby-or-transport-to-fun':             'sports',
    'auto-enthusiast':                            'sports',
    'back-pack-adventure-glow':                   'sports',
    'bathing-suits-and-sexy-dresses':             'sports',
    'bathing-suits-sexy-dresses':                 'sports',
    'fishing-equipment':                          'sports',
    'fishing-gear-funday':                        'sports',
    'men-s-active-essentials':                    'sports',
    'outdoor-comfort-leisure':                    'sports',
    'outdoor-sports-essentials':                  'sports',
    'outdoor-world':                              'sports',
    'outfit-the-outdoors':                        'sports',
    'peak-outdoor-living':                        'sports',
    'sports-gear':                                'sports',
    'sports-outdoor-recreation':                  'sports',
    'sporty-headwear':                            'sports',
    'swim-glam-comfort-glow':                     'sports',
    'wild-spirit-sport-vibe':                     'sports',
    'wild-spirit-wear':                           'sports',
    'yoga-bliss-gear':                            'sports',
    'yoga-essentials-premium-accessories-relax':  'sports',
    'yoga-essentials-premium-leggings-relax':     'sports',
    'summer-fun':                                 'sports',
    'summer-heat':                                'sports',

    # Home decor / kitchen
    'cozy-comfort-essentials':                    'home',
    'craft-clean-home-bliss':                     'home',
    'craft-household-equipment-cleaning':         'home',
    'craft-household-equipment-projects-cleaning':'home',
    'fresh-ground-legends-brew':                  'home',
    'garden-bliss-tool':                          'home',
    'kitchen-gear-expert-approved-gear':          'home',
    'pure-bliss-drinkware-charm':                 'home',
    'pure-chef-home-glow':                        'home',
    'trendy-tumblers':                            'home',
    'wall-art-cozy':                              'home',

    # Jewelry / accessories
    'elegance-redefined':                         'jewelry',
    'jewelry-keepsakes-gifts':                    'jewelry',
    'jewelry-spark-glam':                         'jewelry',
    'teal-roses-elegant-and-unique':              'jewelry',

    # Kids / family / party
    'kids-toys':                                  'kids',
    'celebration-supplies':                       'kids',
    'party-essentials':                           'kids',
    'stocking-stuffers':                          'kids',
    'holiday-celebration':                        'jewelry',
    'holiday-presents-glow':                      'jewelry',
    'thoughtful-gifts-gadgets':                   'jewelry',
    'blossom-fields-children':                    'kids',

    # Wellness / beauty / self-care
    'health-and-wellness-products':               'wellness',
    'health-wellness':                            'wellness',
    'health-wellness-products':                   'wellness',
    'human-hair-wigs':                            'wellness',
    'human-hair-wigs-lace-front':                 'wellness',
    'mindful-pet-calm-glow':                      'wellness',
    'radiant-self-care-empowerment':              'wellness',
    'sassy-glam-color-burst':                     'wellness',
    'tropical-tide-lipstick':                     'wellness',
    'wellness-focus':                             'wellness',
    'wellness-planning-mindful-living-self-care': 'wellness',
    'beyond-screen-recharge':                     'wellness',

    # Americana / patriotic / humor
    'classic-americana-gear':                     'americana',
    'classic-americana-style-vibe':               'americana',
    'neutral-ground-cease-fire-area':             'americana',
    'on-the-run-zombie-fleeing':                  'americana',
    'political-satire':                           'americana',
    'sarcastic-astrological-joke-signs':          'americana',

    # Apparel / fashion / bags
    'apparel-and-shoes':                          'apparel',
    'avatar-friendly-shoes':                      'apparel',
    'azure':                                      'apparel',
    'bright-colored-yoga-pants-flowy-nebula-collection': 'apparel',
    'celestial-avatar':                           'apparel',
    'crowd-favorites-selling':                    'apparel',
    'crowd-favorites-selling-now':                'apparel',
    'daily-wear-style':                           'apparel',
    'dresses-chic-vibe-glow':                     'apparel',
    'gone-dogs-mom':                              'home',
    'hats-and-caps':                              'apparel',
    'hats-caps-gear':                             'apparel',
    'hot-picks-moving-quick':                     'apparel',
    'iron-phoenix-hoodies':                       'gaming',
    'just-shirts-casual-vibe':                    'apparel',
    'just-shoes-collection':                      'apparel',
    'just-shoes-collection-bold-footwear':        'apparel',
    'leggings-and-pants':                         'apparel',
    'leggings-pants-charm':                       'apparel',
    'little-white-dress':                         'apparel',
    'purse-party-glam-spark':                     'apparel',
    'stylish-bags':                               'apparel',
    'summer-style-glow':                          'apparel',
    'thoughtful-gift-ideas':                      'jewelry',
    'tote-bag-eco-charm':                         'apparel',
    'trending-finds':                             'new',
    'hot-picks-moving-quick':                     'new',
    'classic-t-shirts':                           'apparel',
}

# Old ironphoenix.store collection handles -> department key
IRONPHOENIX_MAP = {
    'fresh-ground-legends-brew':      'home',
    'legends-brew-coffee':            'home',
    'game-inspired-jewelry':          'jewelry',
    'gamer-hats':                     'gaming',
    'gaming-gear-gamers-paradise':    'gaming',
    'little-white-dress':             'apparel',
    'pajama-and-lounge-wear':         'wellness',
}

# Keyword fallback for product slugs pointing to /
KEYWORD_MAP = [
    ('gaming',   ['gaming', 'gamer', 'gamers', 'rgb', 'wireless-charger', 'monitor',
                  'speaker', 'earphone', 'smart-watch', 'camera', 'pocket-4k',
                  'night-light', 'tech', 'magnetic-car-phone', 'dancing-cactus']),
    ('sports',   ['sport', 'sports', 'baseball', 'basketball', 'boxing', 'fishing',
                  'ping-pong', 'table-tennis', 'running-shoe', 'athletic', 'fitness',
                  'camping', 'outdoor', 'adventure', 'tent', 'hiking', 'gazebo',
                  'motorcycle', 'air-pump', 'scoop-net', 'cookware', 'deck-tiles',
                  'yoga', 'swim', 'swimwear', 'bikini', 'kinetic', 'conquer-xtreme']),
    ('americana',['americana', 'patriotic', 'trump', 'red-white-blue', 'murder-trial']),
    ('jewelry',  ['jewelry', 'jewel', 'ring', 'necklace', 'bracelet', 'watch', 'brooch',
                  'rose-gold', 'spark-glam']),
    ('kids',     ['kids', 'children', 'child', 'toy', 'slide-sandal', 'cake-toppers',
                  'luau-party', 'party-decoration', 'party-supplies', 'tableware-set']),
    ('wellness', ['hair-growth', 'serum', 'niacinamide', 'eyeshadow', 'eyeliner',
                  'nail-polish', 'soap', 'wellness', 'health', 'piercing', 'wig',
                  'lace-front', 'beauty', 'self-care', 'galactic-radiance',
                  'massage-ball', 'supplement', 'vacuum-sealer']),
    ('home',     ['home-decor', 'decor', 'cozy', 'drinkware', 'coffee-mug', 'pillow',
                  'rocker', 'ergonomic', 'artificial-rose', 'dessert-cup', 'brew',
                  'monitor-stand', 'pruning']),
    ('apparel',  ['hoodie', 'shorts', 'crop-top', 'dress', 'tote', 'bag', 'shoe', 'shoes',
                  'sandal', 'heel', 'legging', 'pant', 't-shirt', 'apparel', 'fashion',
                  'swimsuit', 'celestial', 'paint-splatter', 'geometric', 'sparkle',
                  'halter', 'wallet', 'handbag', 'backpack']),
]


def fix_encoding(url):
    if 'ourphoenixrise.xn--com%20%20' in url:
        after = url.split('ourphoenixrise.xn--com%20%20', 1)[1]
        path = after.replace('%20%20', '/')
        path = path.rstrip('/')
        path = re.sub(r'-[a-z0-9]{5,8}$', '', path)
        return BASE + '/' + path
    return url


def remap_collection(url):
    # Strip seotid anchors from fabulous-finds
    url = re.sub(r'(collections/fabulous-finds)#seotid\w+', r'\1', url)

    # Fix ironphoenix.store collection links
    m = re.match(r'https?://ironphoenix\.store/collections/([^/?#]+)', url)
    if m:
        handle = m.group(1).rstrip('/')
        dept = IRONPHOENIX_MAP.get(handle)
        return DEPT[dept] if dept else DEPT['apparel']

    # Fix relative /collections/<old-handle> paths
    m = re.match(r'^/collections/([^/?#]+)', url)
    if m:
        handle = m.group(1)
        dept = COLLECTION_MAP.get(handle)
        if dept:
            return DEPT[dept]
        # /collections or /collections/frontpage -> leave as /
        if handle in ('', 'frontpage', 'all'):
            return '/'

    # Fix outdated absolute ourphoenixrise.com collection URLs
    m = re.match(r'https?://(?:www\.)?ourphoenixrise\.com/collections/([^/?#]+)', url)
    if m:
        handle = m.group(1)
        dept = COLLECTION_MAP.get(handle)
        if dept:
            return DEPT[dept]

    return url


def classify_from_slug(from_path):
    slug = from_path.lower()
    if from_path.startswith('/blogs/'):
        return DEPT['blog']
    for dept, keywords in KEYWORD_MAP:
        for kw in keywords:
            if kw in slug:
                return DEPT[dept]
    return None


def fix_row(from_path, to_url):
    url = fix_encoding(to_url)
    url = remap_collection(url)
    if url == '/':
        # Check if the from-path itself is a known old collection
        m = re.match(r'^/collections/([^/?#]+)', from_path)
        if m:
            dept = COLLECTION_MAP.get(m.group(1))
            if dept:
                return DEPT[dept]
        classified = classify_from_slug(from_path)
        if classified:
            return classified
        # Everything else lands in fabulous finds
        return DEPT['apparel']
    return url


input_file  = 'redirects_export_1 (1).csv'
output_file = 'redirects_fixed.csv'

encoding_fixed = dept_routed = still_home = 0

with open(input_file, 'r', encoding='utf-8') as f_in, \
     open(output_file, 'w', encoding='utf-8', newline='') as f_out:
    reader = csv.reader(f_in, delimiter='\t')
    writer = csv.writer(f_out)
    for row in reader:
        if len(row) == 2:
            from_path, original = row
            fixed = fix_row(from_path, original)
            if fixed != original:
                if 'xn--com' in original:
                    encoding_fixed += 1
                elif original in ('/', '') and fixed != '/':
                    dept_routed += 1
            if fixed == '/':
                still_home += 1
            writer.writerow([from_path, fixed])
        else:
            writer.writerow(row)

print(f"Encoding fixed:        {encoding_fixed}")
print(f"Routed to department:  {dept_routed}")
print(f"Still -> homepage:     {still_home}")
print(f"Output: {output_file}")
