import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base import BaseScraper


class TestDetectPackSize(unittest.TestCase):
    """Test cases for BaseScraper._detect_pack_size() static method."""

    # -------------------------------------------------------------------------
    # 6-pack patterns
    # -------------------------------------------------------------------------
    def test_6_pack_written(self):
        result = BaseScraper._detect_pack_size("Monster Energy 6 Pack 250ml")
        self.assertEqual(result, "6_pack")

    def test_6_pack_hyphenated(self):
        result = BaseScraper._detect_pack_size("Monster Ultra 6-Pack")
        self.assertEqual(result, "6_pack")

    def test_6_pack_pk_abbrev(self):
        result = BaseScraper._detect_pack_size("Monster 6pk Can")
        self.assertEqual(result, "6_pack")

    # -------------------------------------------------------------------------
    # 8-pack patterns
    # -------------------------------------------------------------------------
    def test_8_pack_written(self):
        result = BaseScraper._detect_pack_size("Monster Ultra White 8 Pack")
        self.assertEqual(result, "8_pack")

    def test_8_pack_hyphenated(self):
        result = BaseScraper._detect_pack_size("Monster 8-Pack")
        self.assertEqual(result, "8_pack")

    # -------------------------------------------------------------------------
    # 10-pack patterns
    # -------------------------------------------------------------------------
    def test_10_pack_written(self):
        result = BaseScraper._detect_pack_size("Monster Energy 10 Pack")
        self.assertEqual(result, "10_pack")

    def test_10_pack_hyphenated(self):
        result = BaseScraper._detect_pack_size("Monster Ultra 10-Pack")
        self.assertEqual(result, "10_pack")

    # -------------------------------------------------------------------------
    # 12-pack patterns
    # -------------------------------------------------------------------------
    def test_12_pack_written(self):
        result = BaseScraper._detect_pack_size("12 Pack Monster Ultra")
        self.assertEqual(result, "12_pack")

    def test_12_pack_pk_abbrev(self):
        result = BaseScraper._detect_pack_size("Monster Energy 12pk")
        self.assertEqual(result, "12_pack")

    def test_12_pack_x_format(self):
        result = BaseScraper._detect_pack_size("Monster 12 x 500ml")
        self.assertEqual(result, "12_pack")

    def test_12_pack_of_format(self):
        result = BaseScraper._detect_pack_size("Monster Pack of 12")
        self.assertEqual(result, "12_pack")

    # -------------------------------------------------------------------------
    # 24-pack patterns
    # -------------------------------------------------------------------------
    def test_24_pack_pk_abbrev(self):
        result = BaseScraper._detect_pack_size("Monster 24pk Case")
        self.assertEqual(result, "24_pack")

    def test_24_pack_written(self):
        result = BaseScraper._detect_pack_size("Monster Energy 24 Pack")
        self.assertEqual(result, "24_pack")

    # -------------------------------------------------------------------------
    # Existing 4-pack (no regression)
    # -------------------------------------------------------------------------
    def test_4_pack_hyphenated(self):
        result = BaseScraper._detect_pack_size("Monster Ultra White 4-Pack")
        self.assertEqual(result, "4_pack")

    def test_4_pack_white_zero_sugar(self):
        result = BaseScraper._detect_pack_size("White Monster Zero Sugar 4-Pack")
        self.assertEqual(result, "4_pack")

    def test_4_pack_x_format(self):
        result = BaseScraper._detect_pack_size("Monster 4 x 500ml")
        self.assertEqual(result, "4_pack")

    def test_4_pack_multipack(self):
        result = BaseScraper._detect_pack_size("Monster Multipack")
        self.assertEqual(result, "4_pack")

    # -------------------------------------------------------------------------
    # Existing single can (no regression)
    # -------------------------------------------------------------------------
    def test_single_no_indicator_no_size(self):
        result = BaseScraper._detect_pack_size("Monster Ultra White")
        self.assertEqual(result, "unknown")

    def test_single_500ml_no_pack(self):
        result = BaseScraper._detect_pack_size("Monster Energy Drink 500ml")
        self.assertEqual(result, "single")

    def test_single_500ml_hydro(self):
        result = BaseScraper._detect_pack_size("Monster Hydro Watermelon 500ml")
        self.assertEqual(result, "single")

    def test_single_1x_can(self):
        result = BaseScraper._detect_pack_size("Monster 1x Can")
        self.assertEqual(result, "single")

    def test_single_word(self):
        result = BaseScraper._detect_pack_size("Monster Single Can")
        self.assertEqual(result, "single")

    # -------------------------------------------------------------------------
    # Edge cases
    # -------------------------------------------------------------------------
    def test_edge_no_pack_no_size(self):
        result = BaseScraper._detect_pack_size("White Monster Zero Sugar")
        self.assertEqual(result, "unknown")

    def test_edge_generic_name(self):
        result = BaseScraper._detect_pack_size("Monster Energy Drink")
        self.assertEqual(result, "unknown")

    def test_edge_empty_string(self):
        result = BaseScraper._detect_pack_size("")
        self.assertEqual(result, "unknown")

    def test_6x_naked_format(self):
        result = BaseScraper._detect_pack_size("Monster 6x")
        self.assertEqual(result, "6_pack")


# Cloudflare challenge markers — duplicated from dunnes_ie.py for test isolation.
_CLOUDFLARE_MARKERS = [
    "Checking your browser",
    "Just a moment",
    "cf-browser-verification",
    "cf-challenge-running",
]


def _is_cloudflare_mock(html: str) -> bool:
    lowered = html.lower()
    return any(marker.lower() in lowered for marker in _CLOUDFLARE_MARKERS)


class TestCloudflareDetection(unittest.TestCase):

    def test_detects_403_with_challenge_text(self):
        self.assertTrue(_is_cloudflare_mock(
            "<html><body>Just a moment... checking your browser</body></html>"
        ))

    def test_detects_200_with_cf_challenge(self):
        self.assertTrue(_is_cloudflare_mock(
            '<html><head><title>Attention Required!</title>'
            '<script src="/cf-browser-verification"></script></head></html>'
        ))

    def test_detects_cf_challenge_running(self):
        self.assertTrue(_is_cloudflare_mock(
            '<html>cf-challenge-running: Cloudflare challenge in progress</html>'
        ))

    def test_ignores_normal_response(self):
        self.assertFalse(_is_cloudflare_mock(
            '<html><body>Normal product page with Monster Energy drinks</body></html>'
        ))

    def test_ignores_empty_response(self):
        self.assertFalse(_is_cloudflare_mock(""))

    def test_ignores_unrelated_403(self):
        self.assertFalse(_is_cloudflare_mock(
            "<html><body>403 Forbidden: Access Denied</body></html>"
        ))


try:
    from dunnes_ie import DunnesIEScraper
    _HAS_DUNNES_DEPS = True
except ImportError:
    DunnesIEScraper = None  # type: ignore[assignment]
    _HAS_DUNNES_DEPS = False


@unittest.skipUnless(_HAS_DUNNES_DEPS, "curl_cffi not installed — skipping Dunnes integration tests")
class TestCloudflareIntegration(unittest.TestCase):

    def test_cloudflare_blocked_starts_false(self):
        scraper = DunnesIEScraper()
        self.assertFalse(scraper.cloudflare_blocked)

    def test_is_cloudflare_challenge_matches_markers(self):
        self.assertTrue(
            DunnesIEScraper._is_cloudflare_challenge(
                "<html><body>Just a moment... checking your browser</body></html>"
            )
        )

    def test_is_cloudflare_challenge_rejects_normal(self):
        self.assertFalse(
            DunnesIEScraper._is_cloudflare_challenge(
                "<html><body>Monster Energy Ultra White</body></html>"
            )
        )


class TestValidateMonsterProduct(unittest.TestCase):
    """Test cases for BaseScraper._validate_monster_product() static method."""

    def test_legitimate_monster_product(self):
        """Known Monster variants must be accepted."""
        self.assertTrue(BaseScraper._validate_monster_product("Monster Ultra White"))
        self.assertTrue(BaseScraper._validate_monster_product("Monster Mango Loco"))
        self.assertTrue(BaseScraper._validate_monster_product("Monster Zero Sugar"))

    def test_false_positive_rejected(self):
        """Non-Monster products with 'monster' in the name must be rejected."""
        self.assertFalse(BaseScraper._validate_monster_product("Monster Munch Crisps"))
        self.assertFalse(BaseScraper._validate_monster_product("Monster Mash Board Game"))
        self.assertFalse(BaseScraper._validate_monster_product("Monster Truck Toy"))
        self.assertFalse(BaseScraper._validate_monster_product("Monster High Doll"))
        self.assertFalse(BaseScraper._validate_monster_product("Monster Jam Stunt"))

    def test_no_monster_in_name(self):
        """Products without 'monster' must be rejected."""
        self.assertFalse(BaseScraper._validate_monster_product("Coca Cola Zero"))
        self.assertFalse(BaseScraper._validate_monster_product("Sprite Lemon"))


if __name__ == "__main__":
    unittest.main()
