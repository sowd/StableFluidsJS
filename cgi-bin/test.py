# -*- coding: utf-8 -*-
import unittest
import index

# Unit test on python: https://qiita.com/aomidro/items/3e3449fde924893f18ca
# Python import trick: https://qiita.com/karadaharu/items/37403e6e82ae4417d1b3

class TestClass(unittest.TestCase):
    def test_add(self):
        value1 = 2
        value2 = 4
        expect = 6

        actual = index.add(value1,value2)
        self.assertEqual(expect,actual)

if __name__ == "__main__":
    unittest.main()

''' Assert functions list
ASSERメソッドの種類	チェック対象
assertEqual(a, b)	a == b
assertNotEqual(a, b)	a != b
assertTrue(x)	bool(x) is True
assertFalse(x)	bool(x) is False
assertIs(a, b)	a is b
assertIsNot(a, b)	a is not b
assertIsNone(x)	x is None
assertIsNotNone(x)	x is not None
assertIn(a, b)	a in b
assertNotIn(a, b)	a not in b
assertIsInstance(a, b)	isinstance(a, b)
assertNotIsInstance(a, b)	not isinstance(a, b)
assertAlmostEqual(a, b)	round(a-b, 7) == 0
assertNotAlmostEqual(a, b)	round(a-b, 7) != 0
assertGreater(a, b)	-a > b
assertGreaterEqual(a, b)	a >= b
assertLess(a, b)	a < b
assertLessEqual(a, b)	a <= b
assertRegexpMatches(s, r)	r.search(s)
assertNotRegexpMatches(s, r)	not r.search(s)
assertDictContainsSubset(a, b)	all the key/value pairs in a exist in b
'''
